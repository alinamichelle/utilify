require 'httparty'
require 'yaml'

module Providers
  class GasLdc
    include HTTParty
    
    BASE_URL = 'https://maps.nccs.nasa.gov/mapping/rest/services/hifld_open/energy/MapServer/29/query'
    
    # Common gas provider URL mappings
    PROVIDER_URLS = {
      /texas gas service/i => 'https://www.texasgasservice.com/',
      /centerpoint/i => 'https://www.centerpointenergy.com/',
      /atmos energy/i => 'https://www.atmosenergy.com/',
      /coserv gas/i => 'https://www.coserv.com/'
    }
    
    def initialize
      # Load local overrides from config
      override_file = Rails.root.join('config', 'local_overrides.yml')
      @overrides = if File.exist?(override_file)
        YAML.load_file(override_file)['gas'] || {}
      else
        {}
      end
    end
    
    def lookup(params)
      coordinates = params[:coordinates] || params
      return build_unknown_response if coordinates.nil? || !coordinates[:lat] || !coordinates[:lng]
      
      lat = coordinates[:lat]
      lng = coordinates[:lng]
      county = params[:county]
      zip = params[:zip]
      
      query_params = {
        f: 'json',
        geometry: JSON.generate({
          x: lng,
          y: lat,
          spatialReference: { wkid: 4326 }
        }),
        geometryType: 'esriGeometryPoint',
        inSR: 4326,
        spatialRel: 'esriSpatialRelIntersects',
        returnGeometry: false,
        outFields: '*'
      }
      
      options = {
        query: query_params,
        timeout: 5,
        open_timeout: 5
      }
      
      Rails.logger.info "Querying Gas LDC at #{BASE_URL}" if ENV['DEBUG']
      
      retries = 0
      max_retries = 2
      
      begin
        response = self.class.get(BASE_URL, options)
        
        if response.code == 200
          data = response.parsed_response
          
          if data['features'] && data['features'].length > 0
            feature = data['features'].first
            attributes = feature['attributes'] || {}
            
            # Extract provider name from HIFLD
            hifld_provider = extract_provider_name(attributes)
            
            # Check for local overrides
            override_provider = find_override(county, zip)
            
            if override_provider && override_provider != hifld_provider
              # Use override provider
              provider_url = map_provider_url(override_provider)
              
              {
                provider: override_provider,
                source: 'HIFLD LDC Territories',
                confidence: 'likely',
                status_text: 'Local override for this area; confirm on provider site',
                next_actions: build_next_actions(provider_url),
                meta: attributes.merge(
                  hifld_name: hifld_provider,
                  override_applied: true
                )
              }
            elsif hifld_provider
              # Use HIFLD provider
              provider_url = map_provider_url(hifld_provider)
              
              {
                provider: hifld_provider,
                source: 'HIFLD LDC Territories',
                confidence: 'likely',
                status_text: 'Territory match from HIFLD',
                next_actions: build_next_actions(provider_url),
                meta: attributes
              }
            else
              build_unknown_response
            end
          else
            # No HIFLD match, but check for override
            override_provider = find_override(county, zip)
            
            if override_provider
              provider_url = map_provider_url(override_provider)
              
              {
                provider: override_provider,
                source: 'Local Override',
                confidence: 'likely',
                status_text: 'Local override for this area; confirm on provider site',
                next_actions: build_next_actions(provider_url),
                meta: { override_applied: true }
              }
            else
              build_unknown_response
            end
          end
        elsif response.code == 429 || response.code >= 500
          raise HTTParty::Error, "HTTP #{response.code}"
        else
          build_unknown_response.merge(
            meta: { error: "Unexpected response: #{response.code}" }
          )
        end
      rescue Net::OpenTimeout, Net::ReadTimeout, HTTParty::Error => e
        retries += 1
        if retries <= max_retries
          sleep_time = (2 ** retries) + rand(0.0..1.0)
          Rails.logger.warn "Gas LDC retry #{retries}/#{max_retries} after #{e.message}, sleeping #{sleep_time}s"
          sleep(sleep_time)
          retry
        else
          Rails.logger.error "Gas LDC lookup failed: #{e.message}"
          
          # Even on failure, check for override
          override_provider = find_override(county, zip)
          
          if override_provider
            provider_url = map_provider_url(override_provider)
            
            {
              provider: override_provider,
              source: 'Local Override',
              confidence: 'likely',
              status_text: 'Local override for this area; confirm on provider site',
              next_actions: build_next_actions(provider_url),
              meta: { 
                error: "Service unavailable: #{e.message}",
                override_applied: true 
              }
            }
          else
            build_unknown_response.merge(
              meta: { error: "Service unavailable: #{e.message}" }
            )
          end
        end
      rescue StandardError => e
        Rails.logger.error "Gas LDC error: #{e.message}"
        build_unknown_response.merge(
          meta: { error: e.message }
        )
      end
    end
    
    private
    
    def find_override(county, zip)
      # Check county override first
      if county && @overrides['county']
        county_key = @overrides['county'].keys.find { |k| k.downcase == county.to_s.downcase }
        return @overrides['county'][county_key] if county_key
      end
      
      # Check zip override
      if zip && @overrides['zip']
        return @overrides['zip'][zip.to_s]
      end
      
      nil
    end
    
    def extract_provider_name(attributes)
      # Try multiple fields in order of preference
      name = attributes['NAME'] || 
             attributes['name'] ||
             attributes['COMPANY'] ||
             attributes['company'] ||
             attributes['UTILITY'] ||
             attributes['utility']
      
      # Clean up common suffixes
      if name
        name = name.strip
        name = name.sub(/\s+(LLC|INC|CORP|CORPORATION|CO\.?|COMPANY)$/i, '')
        name unless name.empty?
      else
        nil
      end
    end
    
    def map_provider_url(provider_name)
      return nil unless provider_name
      
      PROVIDER_URLS.each do |pattern, url|
        return url if provider_name =~ pattern
      end
      nil
    end
    
    def build_next_actions(provider_url)
      actions = []
      
      if provider_url
        actions << {
          label: 'Start / Transfer Service',
          url: provider_url,
          kind: 'primary'
        }
        actions << {
          label: 'Emergency: Smell Gas? Call 911 and Utility',
          url: provider_url,
          kind: 'secondary'
        }
      else
        actions << {
          label: 'Start / Transfer Service',
          url: nil,
          kind: 'primary'
        }
        actions << {
          label: 'Emergency: Smell Gas? Call 911',
          url: nil,
          kind: 'secondary'
        }
      end
      
      actions
    end
    
    def build_unknown_response
      {
        provider: nil,
        source: 'HIFLD LDC Territories',
        confidence: 'unknown',
        status_text: nil,
        next_actions: [],
        meta: {}
      }
    end
  end
end