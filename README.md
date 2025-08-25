# Utilify

A public-facing MVP that answers: **"Who serves this address in Austin?"** for Electric, Water/Wastewater, Trash/Recycling/Compost, and Natural Gas utilities.

## Architecture

- **Backend**: Ruby on Rails 7 (API-only) - Geocodes addresses and performs point-in-polygon lookups against Austin GIS & HIFLD layers
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS - Simple form interface to query and display provider information
- **Monorepo Structure**: Backend and Frontend apps in a single repository with shared tooling

## Data Sources

- **Electric**: Austin Energy service area (ArcGIS FeatureServer)
- **Water/Wastewater**: Austin Water service areas and MUDs (MapServer)
- **Natural Gas**: LDC Territories from HIFLD (MapServer)
- **Trash/Recycling/Compost**: Austin Resource Recovery (static link)

## Prerequisites

- Ruby 3.2+
- Node.js 18+
- PostgreSQL
- Foreman (for running multiple processes)

## Quick Start

```bash
# Clone and setup
cd ~/projects/utilify
make setup

# Run both backend and frontend
make dev

# Open http://localhost:3000 in your browser
```

## Development

### Running Services Individually

```bash
# Backend only (Rails API on port 4000)
make backend

# Frontend only (Next.js on port 3000)
make frontend

# Run tests
make test
```

### Environment Variables

Copy the example files and configure as needed:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

## API Usage

### Sample Request

```bash
curl "http://localhost:4000/api/v1/providers?address=301+W+2nd+St,+Austin,+TX+78701"
```

### Response Format

```json
{
  "address": "301 W 2nd St, Austin, TX 78701",
  "location": {
    "lat": 30.2657,
    "lng": -97.7501,
    "display_name": "301 West 2nd Street, Austin, TX 78701"
  },
  "providers": {
    "electric": {
      "provider": "Austin Energy",
      "source": "ArcGIS FeatureServer",
      "meta": {}
    },
    "water": {
      "provider": "Austin Water",
      "source": "AustinWater MapServer",
      "meta": {}
    },
    "trash": {
      "provider": "Austin Resource Recovery",
      "link": "https://www.austintexas.gov/department/austin-resource-recovery-0"
    },
    "gas": {
      "provider": "Texas Gas Service",
      "source": "HIFLD LDC Territories",
      "meta": {}
    }
  }
}
```

## Testing

Backend tests use RSpec:

```bash
cd backend
bundle exec rspec
```

## Troubleshooting

- Ensure PostgreSQL is running locally
- Check that ports 3000 and 4000 are available
- Verify environment variables are set correctly
- For geocoding issues, check Nominatim rate limits

## License

MIT