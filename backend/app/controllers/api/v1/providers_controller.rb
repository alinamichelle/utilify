require 'digest'

module Api
  module V1
    class ProvidersController < ApplicationController
      def index
        address = params[:address]
        
        if address.blank?
          render json: { error: 'Address is required' }, status: :unprocessable_entity
          return
        end

        # Use caching for 15 minutes per address
        cache_key = "providers:#{Digest::SHA256.hexdigest(address.downcase.strip)}"
        
        response = Rails.cache.fetch(cache_key, expires_in: 15.minutes) do
          # Geocode the address
          location = Geocode::Nominatim.new.geocode(address)
          
          if location.nil?
            { error: 'Unable to geocode address', status: :unprocessable_entity }
          else
            # Extract city, county, and zip from geocoded display name
            city, county, zip = extract_location_details(location[:display_name])

            # Query each provider service
            coordinates = { lat: location[:lat], lng: location[:lng] }
            
            electric_provider = Providers::AustinEnergy.new.lookup(coordinates)
            water_provider = Providers::AustinWater.new.lookup(coordinates)
            
            # Pass additional context to gas service including zip
            gas_provider = Providers::GasLdc.new.lookup(
              coordinates: coordinates,
              county: county,
              zip: zip
            )
            
            # Pass additional context to trash service
            trash_provider = Providers::TrashArr.new.lookup(
              address: address,
              city: city,
              county: county
            )

            # Build successful response
            {
              address: address,
              location: location,
              providers: {
                electric: electric_provider,
                water: water_provider,
                trash: trash_provider,
                gas: gas_provider
              }
            }
          end
        end

        # Handle cached error responses
        if response[:error]
          render json: { error: response[:error] }, status: response[:status] || :ok
        else
          render json: response
        end
      end

      private

      def extract_location_details(display_name)
        return [nil, nil, nil] if display_name.blank?

        # Parse display name to extract city, county, and zip
        # Common formats:
        # "123 Main St, Austin, Travis County, Texas, 78701, USA"
        # "Foxtrot, 301, West 2nd Street, Warehouse District, Austin, Travis County, Texas, 78701, United States"
        
        parts = display_name.split(',').map(&:strip)
        
        city = nil
        county = nil
        zip = nil

        # Try to find components
        parts.each_with_index do |part, index|
          # Skip first element (usually street address or business name)
          next if index == 0
          
          # Check for ZIP code (5 digits)
          if part.match?(/^\d{5}/)
            zip = part
          # Check for county
          elsif part.downcase.include?('county')
            county = part.sub(/\s+County$/i, '')
          # Check for state abbreviation or country
          elsif !part.match?(/^[A-Z]{2}$/) && !['USA', 'United States', 'Texas'].include?(part)
            # Likely a city name if not already found
            if city.nil? && !part.downcase.include?('district') && !part.match?(/^\d+$/)
              city = part
            end
          end
        end

        # Special handling for Austin/Travis County
        if city.nil? && display_name.downcase.include?('austin')
          city = 'Austin'
        end
        
        if county.nil? && display_name.downcase.include?('travis')
          county = 'Travis'
        end
        
        # Try to extract ZIP if not found
        if zip.nil?
          zip_match = display_name.match(/\b(\d{5})\b/)
          zip = zip_match[1] if zip_match
        end

        Rails.logger.info "Extracted location details - City: #{city}, County: #{county}, ZIP: #{zip}" if ENV['DEBUG']

        [city, county, zip]
      end
    end
  end
end