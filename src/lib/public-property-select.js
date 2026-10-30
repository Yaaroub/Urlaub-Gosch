// Explicit public fields prevent calendar subscription URLs and guest data leaking.
export const publicPropertySelect = {
  id: true, slug: true, title: true, description: true,
  location: true, address: true, maxPersons: true, dogsAllowed: true,
  lat: true, lng: true, region: true, kuschelwochenEnabled: true,
  amenities: true, pricePeriods: true,
};
