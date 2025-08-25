require 'rails_helper'

RSpec.describe Providers::AustinEnergy do
  let(:service) { described_class.new }
  
  describe '#lookup' do
    context 'when coordinates are provided' do
      let(:coordinates) { { lat: 30.2657, lng: -97.7501 } }
      
      context 'when location is within Austin Energy service area' do
        before do
          # Stub the HTTP request to simulate a hit
          response_body = {
            'features' => [
              {
                'attributes' => {
                  'OBJECTID' => 1,
                  'SERVICE_AREA' => 'Austin Energy',
                  'AREA_SQ_MI' => 437.0
                }
              }
            ]
          }
          
          allow(service.class).to receive(:get).and_return(
            double('response', code: 200, parsed_response: response_body)
          )
        end
        
        it 'returns Austin Energy as the provider' do
          result = service.lookup(coordinates)
          
          expect(result[:provider]).to eq('Austin Energy')
          expect(result[:source]).to eq('ArcGIS FeatureServer')
          expect(result[:meta]).to include('SERVICE_AREA' => 'Austin Energy')
        end
      end
      
      context 'when location is outside Austin Energy service area' do
        before do
          # Stub the HTTP request to simulate a miss
          response_body = { 'features' => [] }
          
          allow(service.class).to receive(:get).and_return(
            double('response', code: 200, parsed_response: response_body)
          )
        end
        
        it 'returns nil as the provider' do
          result = service.lookup(coordinates)
          
          expect(result[:provider]).to be_nil
          expect(result[:source]).to eq('ArcGIS FeatureServer')
          expect(result[:meta]).to eq({})
        end
      end
      
      context 'when the service is unavailable' do
        before do
          allow(service.class).to receive(:get).and_raise(Net::ReadTimeout)
        end
        
        it 'returns an error in meta after retries' do
          result = service.lookup(coordinates)
          
          expect(result[:provider]).to be_nil
          expect(result[:source]).to eq('ArcGIS FeatureServer')
          expect(result[:meta]).to have_key(:error)
        end
      end
    end
    
    context 'when coordinates are nil' do
      it 'returns nil' do
        result = service.lookup(nil)
        expect(result).to be_nil
      end
    end
  end
end