import { useState } from 'react';
import { Copy, Check, Gift, Users } from 'lucide-react';

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);
  
  // En producción, esto vendría del usuario logueado
  const referralCode = 'VOCARI2026';
  const referralLink = `https://vocari.cl?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Gift className="text-purple-600" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-purple-900">Programa de Referidos</h3>
          <p className="text-sm text-purple-700">Gana $5 USD por cada amigo</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-purple-800 block mb-1">
            Tu código de referido
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg border border-purple-200 bg-white text-purple-900 font-mono"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-purple-800 block mb-1">
            Comparte tu enlace
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg border border-purple-200 bg-white text-purple-900 text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <div className="flex items-center gap-2 text-sm text-purple-700">
          <Users size={16} />
          <span>3 amigos se han unido este mes</span>
        </div>
      </div>
    </div>
  );
}
