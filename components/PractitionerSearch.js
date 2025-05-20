'use client';

import { useState } from 'react';

export default function PractitionerSearch() {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(10);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (state) params.append('address-state', state);
    params.append('_count', resultCount.toString());

    const url = `https://public.fhir.flex.optum.com/R4/Practitioner?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.entry || []);
    } catch (err) {
      console.error('Failed to fetch practitioners:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-cyan-600 mb-10">
          UHC Provider Search
        </h1>

        {/* Result count dropdown */}
        <div className="mb-4 text-right max-w-4xl mx-auto">
          <label className="mr-2 text-sm text-gray-600">Results per page:</label>
          <select
            value={resultCount}
            onChange={(e) => setResultCount(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto"
        >
          <input
            type="text"
            placeholder="Practitioner name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-1 px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <input
            type="text"
            placeholder="State (e.g., CA)"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="col-span-1 px-4 py-2 rounded-lg border bg-white border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button
            type="submit"
            className="col-span-1 px-4 py-2 bg-cyan-600/50 hover:bg-cyan-600 text-white rounded-lg shadow-md transition"
          >
            Search
          </button>
        </form>

        {/* Results container */}
        <div className="relative max-w-4xl mx-auto bg-white shadow-lg rounded-md overflow-hidden min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-xl z-50">
              <div className="flex flex-col items-center space-y-4">
                <div className="loader"></div>
                <p className="text-gray-700 text-lg">Loading results...</p>
              </div>
            </div>
          )}

          {!loading && results && results.length > 0 && (
            <div className="overflow-y-auto max-h-[500px] rounded-b-xl">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="sticky top-0 z-10 bg-cyan-600 text-gray-700 backdrop-blur-sm shadow-sm">
                  <tr>
                    <th className="px-6 py-3 font-bold">Name</th>
                    <th className="px-6 py-3 font-bold">Phone</th>
                    <th className="px-6 py-3 font-bold">Degree</th>
                    <th className="px-6 py-3 font-bold">NPI</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter((entry, idx, self) => {
                      const npi = entry.resource.identifier?.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value;
                      return npi && self.findIndex(e => {
                        const otherNpi = e.resource.identifier?.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value;
                        return otherNpi === npi;
                      }) === idx;
                    })
                    .map((entry, idx) => {
                      const practitioner = entry.resource;
                      const nameObj = practitioner.name?.[0];
                      const fullName = `${nameObj?.given?.join(' ') || ''} ${nameObj?.family || ''}`;

                      const npi = practitioner.identifier?.find(id => id.system === 'http://hl7.org/fhir/sid/us-npi')?.value || '—';
                      const rawPhone = practitioner.telecom?.find(t => t.system === 'phone')?.value || '—';
                      const phone = rawPhone.replace(/-/g, '');

                      const rawDegree = practitioner.qualification?.[0]?.code?.coding?.[0]?.display || '—';
                      const degree = rawDegree.replace(/^Degree[-:\s]?/i, '');

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-cyan-600/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">{fullName}</td>
                          <td className="px-6 py-4">{phone}</td>
                          <td className="px-6 py-4">{degree}</td>
                          <td className="px-6 py-4">{npi}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && results && results.length === 0 && (
            <p className="p-6 text-center text-gray-600">No practitioners found.</p>
          )}
        </div>
      </div>
    </div>
  );
}