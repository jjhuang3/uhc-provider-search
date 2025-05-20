'use client';

import { useState } from 'react';
import Image from "next/image"

const specialties = [
  { name: 'Family Medicine', code: '207Q00000X' },
  { name: 'Internal Medicine', code: '207R00000X' },
  { name: 'Pediatrics', code: '208000000X' },
  { name: 'Cardiology', code: '207RC0000X' },
  { name: 'Dermatology', code: '207N00000X' },
  { name: 'Psychiatry', code: '2084P0800X' },
  { name: 'Ophthalmology', code: '207W00000X' },
  { name: 'Orthopedic Surgery', code: '207X00000X' },
  { name: 'Radiology', code: '2085R0202X' },
  { name: 'Emergency Medicine', code: '207P00000X' }
];

const usStates = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

const getSpecialtyName = (code) => {
  const match = specialties.find(s => s.code === code);
  return match?.name || '—';
};

export default function ProviderSearch() {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [results, setResults] = useState([]);
  const [locationsMap, setLocationsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(10);
  const [sortConfig, setSortConfig] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setLocationsMap({});

    try {
      const params = new URLSearchParams();
      params.append('service-category', 'prov');
      if (name) params.append('name', name);
      if (state) params.append('location.address-state', state);
      if (zipcode) params.append('location.address-postalcode', zipcode);
      if (specialty) params.append('specialty', specialty);
      params.append('_count', resultCount.toString());

      const url = `https://flex.optum.com/fhirpublic/R4/HealthcareService?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      const entries = data.entry || [];
      setResults(entries);

      const locationIds = new Set();
      entries.forEach(({ resource }) => {
        if (resource.location) {
          resource.location.forEach(locRef => {
            const ref = locRef.reference;
            if (ref?.startsWith('Location/')) {
              const id = ref.split('/')[1];
              if (id) locationIds.add(id);
            }
          });
        }
      });

      if (locationIds.size > 0) {
        const locUrl = `https://flex.optum.com/fhirpublic/R4/Location?_id=${[...locationIds].join(',')}`;
        const locResponse = await fetch(locUrl);
        const locData = await locResponse.json();

        const locMap = {};
        locData.entry?.forEach(({ resource }) => {
          if (resource.id) {
            locMap[resource.id] = resource;
          }
        });

        setLocationsMap(locMap);
      }
    } catch (err) {
      console.error('Failed to fetch providers or locations:', err);
      setResults([]);
      setLocationsMap({});
    } finally {
      setLoading(false);
    }
  };

  const getRowValues = (resource) => {
    const providerName = resource.name || '—';
    const specialtyCode = resource.specialty?.[0]?.coding?.[0]?.code || '';
    const specialtyName = getSpecialtyName(specialtyCode);

    let addressLine = '—', city = '—', state = '—', postalCode = '—';
    const locRef = resource.location?.[0]?.reference;
    const locId = locRef?.split('/')[1];
    const location = locId ? locationsMap[locId] : null;

    if (location?.address) {
      const addr = location.address;
      addressLine = addr.line?.[0] || '—';
      city = addr.city || '—';
      state = addr.state || '—';
      postalCode = addr.postalCode || '—';
    }
    return { providerName, specialtyName, addressLine, city, state, postalCode };
  };

  const sortedResults = (() => {
    if (!sortConfig) return results;

    return [...results].sort((a, b) => {
      const aVals = getRowValues(a.resource);
      const bVals = getRowValues(b.resource);

      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;

      const valA = (aVals[key] || '').toString().toLowerCase();
      const valB = (bVals[key] || '').toString().toLowerCase();

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  })();

  const onSort = (key) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const getSortIndicator = (key) => {
    if (sortConfig?.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="w-full bg-white text-cyan-600 py-4 px-6 shadow-sm">
        <div className="flex items-center space-x-">
          <Image src="/logo.png" alt="HCDL-Logo" width={32} height={32} />
          <h2 className="text-xl font-semibold px-4">Healthcare-Download</h2>
        </div>
      </div>      
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-6xl font-bold tracking-tight text-center  text-cyan-600 mb-10">
          UHC Provider Search
        </h1>
        <div className="mb-4 text-right">
          <label className="mr-2 text-sm text-gray-600">Results per page:</label>
          <select
            value={resultCount}
            onChange={(e) => setResultCount(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {[10, 20, 50].map(num => <option key={num} value={num}>{num}</option>)}
          </select>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10"
        >
          <input
            type="text"
            placeholder="Provider name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Select state</option>
            {usStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Zip code"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Select specialty</option>
            {specialties.map(({ name, code }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          <button
            type="submit"
            className="col-span-2 md:col-span-1 px-4 py-2 bg-cyan-600/50 hover:bg-cyan-600 text-white rounded-lg shadow-md transition"
          >
            Search
          </button>
        </form>

        <div className="relative bg-white shadow-lg rounded-md overflow-hidden min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
              <div className="flex flex-col items-center space-y-4">
                <div className="loader"></div>
                <p className="text-gray-700 text-lg">Loading results...</p>
              </div>
            </div>
          )}

          {!loading && sortedResults.length > 0 && (
            <div className="overflow-y-auto max-h-[500px] rounded-b-xl">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="sticky top-0 z-10 bg-cyan-600 text-white">
                  <tr>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('providerName')}
                      title="Sort by Provider Name"
                    >
                      Provider Name {getSortIndicator('providerName')}
                    </th>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('specialtyName')}
                      title="Sort by Specialty"
                    >
                      Specialty {getSortIndicator('specialtyName')}
                    </th>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('addressLine')}
                      title="Sort by Address Line"
                    >
                      Address Line {getSortIndicator('addressLine')}
                    </th>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('city')}
                      title="Sort by City"
                    >
                      City {getSortIndicator('city')}
                    </th>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('state')}
                      title="Sort by State"
                    >
                      State {getSortIndicator('state')}
                    </th>
                    <th
                      className="px-6 py-3 font-bold cursor-pointer select-none"
                      onClick={() => onSort('postalCode')}
                      title="Sort by Postal Code"
                    >
                      Postal Code {getSortIndicator('postalCode')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map(({ resource }, idx) => {
                    const { providerName, specialtyName, addressLine, city, state, postalCode } = getRowValues(resource);

                    return (
                      <tr key={idx} className={`hover:bg-cyan-600/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4">{providerName}</td>
                        <td className="px-6 py-4">{specialtyName}</td>
                        <td className="px-6 py-4">{addressLine}</td>
                        <td className="px-6 py-4">{city}</td>
                        <td className="px-6 py-4">{state}</td>
                        <td className="px-6 py-4">{postalCode}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && sortedResults.length === 0 && (
            <p className="p-6 mt-14 text-center font-bold text-gray-600">
              {hasSearched 
              ? 'No providers found.'
              : 'Use the entry fields above to search for providers.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}