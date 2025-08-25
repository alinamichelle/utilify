require 'httparty'

module Providers
  class AustinWater
    include HTTParty
    
    BASE_URL = 'https://maps.austintexas.gov/gis/rest/PropertyProfile/AustinWater/MapServer'
    SERVICE_AREA_LAYER = 3
    MUDS_LAYER = 0
    
    def lookup(coordinates)
      return build_unknown_response if coordinates.nil?
      
      lat = coordinates[:lat]
      lng = coordinates[:lng]
      
      # First check Austin Water service area (layer 3)
      result = query_layer(SERVICE_AREA_LAYER, lat, lng)
      
      if result && result[:provider]
        return {
          provider: 'Austin Water',
          source: 'AustinWater MapServer',
          confidence: 'confirmed',
          status_text: 'Inside Austin Water service area',
          next_actions: [
            {
              label: 'Start / Stop / Transfer',
              url: 'https://www.austintexas.gov/department/austin-water',
              kind: 'primary'
            },
            {
              label: 'Report Water Issue',
              url: 'https://www.austintexas.gov/department/austin-water',
              kind: 'secondary'
            }
          ],
          meta: result[:meta] || {}
        }
      end
      
      # If not in Austin Water, check MUDs (layer 0)
      result = query_layer(MUDS_LAYER, lat, lng)
      
      if result && result[:provider]
        # Extract MUD name from various possible fields
        attributes = result[:meta] || {}
        mud_name = attributes['NAME'] || 
                   attributes['Utility_Name'] || 
                   attributes['UTILITY'] || 
                   attributes['COMPANY'] || 
                   attributes['PROVIDER'] ||
                   'Unknown MUD'
        
        return {
          provider: "MUD: #{mud_name}",
          source: 'AustinWater MapServer',
          confidence: 'likely',
          status_text: 'Municipal Utility District service area',
          next_actions: [
            {
              label: 'Contact MUD Office',
              url: nil,  # We don't have MUD URLs yet
              kind: 'secondary'
            }
          ],
          meta: attributes
        }
      end
      
      # No water provider found
      build_unknown_response
    end
    
    private
    
    def query_layer(layer_id, lat, lng)
      url = "#{BASE_URL}/#{layer_id}/query"
      
      params = {
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
        query: params,
        timeout: 5,
        open_timeout: 5
      }
      
      Rails.logger.info "Querying Austin Water layer #{layer_id} at #{url}" if ENV['DEBUG']
      
      retries = 0
      max_retries = 2
      
      begin
        response = self.class.get(url, options)
        
        if response.code == 200
          data = response.parsed_response
          
          if data['features'] && data['features'].length > 0
            feature = data['features'].first
            {
              provider: true,
              meta: feature['attributes'] || {}
            }
          else
            nil
          end
        elsif response.code == 429 || response.code >= 500
          raise HTTParty::Error, "HTTP #{response.code}"
        else
          Rails.logger.warn "Austin Water layer #{layer_id} unexpected response: #{response.code}"
          nil
        end
      rescue Net::OpenTimeout, Net::ReadTimeout, HTTParty::Error => e
        retries += 1
        if retries <= max_retries
          sleep_time = (2 ** retries) + rand(0.0..1.0)
          Rails.logger.warn "Austin Water layer #{layer_id} retry #{retries}/#{max_retries} after #{e.message}, sleeping #{sleep_time}s"
          sleep(sleep_time)
          retry
        else
          Rails.logger.error "Austin Water layer #{layer_id} lookup failed: #{e.message}"
          nil
        end
      rescue StandardError => e
        Rails.logger.error "Austin Water layer #{layer_id} error: #{e.message}"
        nil
      end
    end
    
    def build_unknown_response
      {
        provider: nil,
        source: 'AustinWater MapServer',
        confidence: 'unknown',
        status_text: nil,
        next_actions: [],
        meta: {}
      }
    end
  end
end