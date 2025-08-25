require 'rails_helper'

RSpec.describe 'Providers API', type: :request do
  describe 'GET /api/v1/providers' do
    context 'with a valid Austin address' do
      before do
        # Stub the geocoding service to return a known location
        geocode_result = {
          lat: 30.2657,
          lng: -97.7501,
          display_name: '301 West 2nd Street, Austin, Travis County, Texas, 78701, USA'
        }
        
        allow_any_instance_of(Geocode::Nominatim).to receive(:geocode).and_return(geocode_result)
        
        # Stub provider services to avoid external API calls in tests
        allow_any_instance_of(Providers::AustinEnergy).to receive(:lookup).and_return({
          provider: 'Austin Energy',
          source: 'ArcGIS FeatureServer',
          meta: {}
        })
        
        allow_any_instance_of(Providers::AustinWater).to receive(:lookup).and_return({
          provider: 'Austin Water',
          source: 'AustinWater MapServer',
          meta: {}
        })
        
        allow_any_instance_of(Providers::GasLdc).to receive(:lookup).and_return({
          provider: 'Texas Gas Service',
          source: 'HIFLD LDC Territories',
          meta: {}
        })
      end
      
      it 'returns a 200 status' do
        get '/api/v1/providers', params: { address: '301 W 2nd St, Austin, TX 78701' }
        expect(response).to have_http_status(200)
      end
      
      it 'returns JSON with trash provider information' do
        get '/api/v1/providers', params: { address: '301 W 2nd St, Austin, TX 78701' }
        
        json_response = JSON.parse(response.body)
        
        # Check that trash provider is always present
        expect(json_response['providers']).to have_key('trash')
        expect(json_response['providers']['trash']).to be_present
        expect(json_response['providers']['trash']['provider']).to eq('Austin Resource Recovery')
        expect(json_response['providers']['trash']['source']).to eq('City of Austin')
        expect(json_response['providers']['trash']['link']).to be_present
        expect(json_response['providers']['trash']['schedule_url']).to be_present
        expect(json_response['providers']['trash']['meta']).to be_present
        expect(json_response['providers']['trash']['meta']['note']).to eq('Applies to City of Austin addresses.')
      end
      
      it 'includes all utility providers in response' do
        get '/api/v1/providers', params: { address: '301 W 2nd St, Austin, TX 78701' }
        
        json_response = JSON.parse(response.body)
        
        expect(json_response['providers']).to have_key('electric')
        expect(json_response['providers']).to have_key('water')
        expect(json_response['providers']).to have_key('trash')
        expect(json_response['providers']).to have_key('gas')
      end
      
      it 'includes location information' do
        get '/api/v1/providers', params: { address: '301 W 2nd St, Austin, TX 78701' }
        
        json_response = JSON.parse(response.body)
        
        expect(json_response).to have_key('location')
        expect(json_response['location']['lat']).to be_present
        expect(json_response['location']['lng']).to be_present
        expect(json_response['location']['display_name']).to be_present
      end
    end
    
    context 'with a non-Austin address' do
      before do
        geocode_result = {
          lat: 30.3072,
          lng: -97.7560,
          display_name: '123 Main Street, Round Rock, Williamson County, Texas, 78664, USA'
        }
        
        allow_any_instance_of(Geocode::Nominatim).to receive(:geocode).and_return(geocode_result)
        
        # Stub providers to return nil for non-Austin addresses
        allow_any_instance_of(Providers::AustinEnergy).to receive(:lookup).and_return({
          provider: nil,
          source: 'ArcGIS FeatureServer',
          meta: {}
        })
        
        allow_any_instance_of(Providers::AustinWater).to receive(:lookup).and_return({
          provider: nil,
          source: 'AustinWater MapServer',
          meta: {}
        })
        
        allow_any_instance_of(Providers::GasLdc).to receive(:lookup).and_return({
          provider: nil,
          source: 'HIFLD LDC Territories',
          meta: {}
        })
      end
      
      it 'still returns trash provider with appropriate note' do
        get '/api/v1/providers', params: { address: '123 Main St, Round Rock, TX' }
        
        json_response = JSON.parse(response.body)
        
        expect(json_response['providers']['trash']).to be_present
        expect(json_response['providers']['trash']['provider']).to eq('Austin Resource Recovery')
        expect(json_response['providers']['trash']['meta']['note']).to eq('This address may not be served by ARR; confirm locally.')
        expect(json_response['providers']['trash']['meta']['city']).to eq('Round Rock')
      end
    end
    
    context 'with missing address parameter' do
      it 'returns a 422 status with error message' do
        get '/api/v1/providers'
        
        expect(response).to have_http_status(422)
        
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Address is required')
      end
    end
    
    context 'when geocoding fails' do
      before do
        allow_any_instance_of(Geocode::Nominatim).to receive(:geocode).and_return(nil)
      end
      
      it 'returns a 422 status with error message' do
        get '/api/v1/providers', params: { address: 'invalid address' }
        
        expect(response).to have_http_status(422)
        
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Unable to geocode address')
      end
    end
  end
end