require 'httparty'
require 'uri'

module Geocode
  class Nominatim
    include HTTParty
    
    BASE_URL = 'https://nominatim.openstreetmap.org/search'
    
    def initialize
      @user_agent = ENV.fetch('NOMINATIM_USER_AGENT', 'utilify/1.0')
      @email = ENV.fetch('NOMINATIM_EMAIL', 'dev@example.com')
    end
    
    def geocode(address)
      return nil if address.blank?
      
      # Be polite to Nominatim
      sleep(1)
      
      options = {
        query: {
          q: address,
          format: 'jsonv2',
          limit: 1,
          addressdetails: 0
        },
        headers: {
          'User-Agent' => @user_agent,
          'Accept' => 'application/json'
        },
        timeout: 5,
        open_timeout: 5
      }
      
      Rails.logger.info "Geocoding address: #{address}" if ENV['DEBUG']
      
      retries = 0
      max_retries = 2
      
      begin
        response = self.class.get(BASE_URL, options)
        
        if response.code == 200 && response.parsed_response.is_a?(Array) && response.parsed_response.any?
          result = response.parsed_response.first
          {
            lat: result['lat'].to_f,
            lng: result['lon'].to_f,
            display_name: result['display_name']
          }
        elsif response.code == 429 || response.code >= 500
          raise HTTParty::Error, "HTTP #{response.code}"
        else
          nil
        end
      rescue Net::OpenTimeout, Net::ReadTimeout, HTTParty::Error => e
        retries += 1
        if retries <= max_retries
          # Exponential backoff with jitter
          sleep_time = (2 ** retries) + rand(0.0..1.0)
          Rails.logger.warn "Geocoding retry #{retries}/#{max_retries} after #{e.message}, sleeping #{sleep_time}s"
          sleep(sleep_time)
          retry
        else
          Rails.logger.error "Geocoding failed after #{max_retries} retries: #{e.message}"
          nil
        end
      rescue StandardError => e
        Rails.logger.error "Geocoding error: #{e.message}"
        nil
      end
    end
  end
end