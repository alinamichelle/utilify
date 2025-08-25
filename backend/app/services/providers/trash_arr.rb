module Providers
  class TrashArr
    # Austin Resource Recovery official URLs
    SCHEDULE_URL = "https://www.austintexas.gov/services/view-your-recycling-composting-and-trash-schedule"
    BULK_URL = "https://www.austintexas.gov/ondemand"
    
    def lookup(params = {})
      address = params[:address] || params.to_s
      city = params[:city]
      county = params[:county]
      
      is_austin = city.to_s.downcase == 'austin'
      
      # Always return a populated object with confidence and next actions
      {
        provider: 'Austin Resource Recovery',
        source: 'City of Austin',
        confidence: is_austin ? 'confirmed' : 'likely',
        status_text: is_austin ? 'City address' : 'Outside City limits—confirm service',
        link: SCHEDULE_URL,
        schedule_url: SCHEDULE_URL,
        bulk_url: BULK_URL,
        next_actions: [
          {
            label: 'Open My Schedule',
            url: SCHEDULE_URL,
            kind: 'primary'
          },
          {
            label: 'Schedule Bulk/Brush or HHW',
            url: BULK_URL,
            kind: 'secondary'
          }
        ],
        meta: {
          city: city,
          county: county,
          note: build_note(city)
        }
      }
    end
    
    private
    
    def build_note(city)
      if city.to_s.downcase == 'austin'
        'Applies to City of Austin addresses.'
      else
        'This address may not be served by ARR; confirm locally.'
      end
    end
  end
end