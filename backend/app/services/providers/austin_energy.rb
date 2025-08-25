require 'httparty'

module Providers
  class AustinEnergy
    include HTTParty
    
    BASE_URL = 'https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services/UTILITIESCOMMUNICATION_austin_energy_service_area/FeatureServer/0/query'
    
    def lookup(coordinates)
      return build_unknown_response if coordinates.nil?
      
      lat = coordinates[:lat]
      lng = coordinates[:lng]
      
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
      
      Rails.logger.info "Querying Austin Energy at #{BASE_URL}" if ENV['DEBUG']
      
      retries = 0
      max_retries = 2
      
      begin
        response = self.class.get(BASE_URL, options)
        
        if response.code == 200
          data = response.parsed_response
          
          if data['features'] && data['features'].length > 0
            feature = data['features'].first
            {
              provider: 'Austin Energy',
              source: 'ArcGIS FeatureServer',
              confidence: 'confirmed',
              status_text: 'Inside Austin Energy service area',
              next_actions: [
                { 
                  label: 'Start / Transfer Service', 
                  url: 'https://www.austinenergy.com/', 
                  kind: 'primary' 
                },
                { 
                  label: 'Outage Map', 
                  url: 'https://outagemap.austinenergy.com/', 
                  kind: 'secondary' 
                },
                { 
                  label: 'Contact Support', 
                  url: 'https://www.austinenergy.com/ae/contact-us', 
                  kind: 'secondary' 
                }
              ],
              meta: feature['attributes'] || {}
            }
          else
            build_unknown_response
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
          Rails.logger.warn "Austin Energy retry #{retries}/#{max_retries} after #{e.message}, sleeping #{sleep_time}s"
          sleep(sleep_time)
          retry
        else
          Rails.logger.error "Austin Energy lookup failed: #{e.message}"
          build_unknown_response.merge(
            meta: { error: "Service unavailable: #{e.message}" }
          )
        end
      rescue StandardError => e
        Rails.logger.error "Austin Energy error: #{e.message}"
        build_unknown_response.merge(
          meta: { error: e.message }
        )
      end
    end
    
    private
    
    def build_unknown_response
      {
        provider: nil,
        source: 'ArcGIS FeatureServer',
        confidence: 'unknown',
        status_text: nil,
        next_actions: [],
        meta: {}
      }
    end
  end
end