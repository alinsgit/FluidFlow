/**
 * NetworkTab - Network request display component
 *
 * Displays network requests in a table format.
 */

import React from 'react';
import { Wifi } from 'lucide-react';
import type { NetworkTabProps } from './types';

export const NetworkTab: React.FC<NetworkTabProps> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-10">
        <Wifi className="w-5 h-5 mb-2 opacity-50" />
        <span>No network requests recorded</span>
      </div>
    );
  }

  return (
    <div className="min-w-full inline-block align-middle">
      <table className="min-w-full">
        <thead className="bg-slate-900 sticky top-0 z-10 text-slate-400">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium w-20">
              Status
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium w-20">
              Method
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Name
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium w-24">
              Time
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium w-24">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-1.5 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    req.status === 200 || req.status === 201
                      ? 'bg-green-500/10 text-green-400'
                      : req.status === 'ERR'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  {req.status}
                </span>
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap text-slate-300 font-bold">
                {req.method}
              </td>
              <td className="px-3 py-1.5 text-slate-400 truncate max-w-xs" title={req.url}>
                {req.url}
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap text-right text-slate-500">
                {Math.round(req.duration)}ms
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap text-right text-slate-600 text-[10px]">
                {req.timestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
