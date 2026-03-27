import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  UploadCloud, FileText, Calculator, CheckCircle, Download, 
  ChevronRight, Settings, LayoutDashboard, FileSpreadsheet, 
  Plus, AlertCircle, ArrowRight, Save, FileCheck, Building2,
  Package, DollarSign, Calendar, Anchor, Plane, Sparkles,
  RefreshCw, Trash2, Send
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type EstimateData = {
  // 1. 案件基本情報
  contactNo: string;
  buyer: string;
  maker: string;
  product: string;
  category: 'seasoning' | 'parts';
  approver: string;
  reviewer: string;
  assignee: string;

  // 2. 取引条件
  profitMargin: number;
  salesTerms: string;
  paymentTiming: '前' | '後';
  paymentDays: number;
  incoterms: string;
  destination: string;
  portOfLoading: string;

  // 3. 為替情報
  exchangeRate: number;
  exchangeDate: string;

  // 4. 梱包・重量
  length: number;
  width: number;
  height: number;
  actualNW: number;
  actualGW: number;
  offerNW: number;
  offerGW: number;

  // 5. 納期
  deliveryDate: string;
  etd: string;

  // 6. 諸経費 (Sea)
  seaFreightUnitActual: number;
  seaFreightUnitOffer: number;
  seaOtherActual: number;
  seaOtherOffer: number;

  // 7. 諸経費 (Air)
  airFreightActual: number;
  airFreightOffer: number;
  airOtherActual: number;
  airOtherOffer: number;

  // 8. 仕入値
  purchasePriceSea: number;
  purchasePriceAir: number;
  commissionRate: number;
};

const initialData: EstimateData = {
  contactNo: '',
  buyer: '',
  maker: '',
  product: '',
  category: 'parts',
  approver: '',
  reviewer: '',
  assignee: '',
  profitMargin: 15,
  salesTerms: 'T/T',
  paymentTiming: '後',
  paymentDays: 30,
  incoterms: 'FOB',
  destination: '',
  portOfLoading: '',
  exchangeRate: 150,
  exchangeDate: new Date().toISOString().split('T')[0],
  length: 0,
  width: 0,
  height: 0,
  actualNW: 0,
  actualGW: 0,
  offerNW: 0,
  offerGW: 0,
  deliveryDate: '',
  etd: '',
  seaFreightUnitActual: 0,
  seaFreightUnitOffer: 0,
  seaOtherActual: 0,
  seaOtherOffer: 0,
  airFreightActual: 0,
  airFreightOffer: 0,
  airOtherActual: 0,
  airOtherOffer: 0,
  purchasePriceSea: 0,
  purchasePriceAir: 0,
  commissionRate: 0,
};

const mockAiData: Partial<EstimateData> = {
  contactNo: 'EST-2024-001',
  buyer: '株式会社グローバル商事',
  maker: 'Tech Industries Ltd.',
  product: '産業用ロボットアーム X-200',
  category: 'parts',
  profitMargin: 15,
  salesTerms: 'T/T',
  paymentTiming: '後',
  paymentDays: 30,
  incoterms: 'FOB',
  destination: 'TOKYO, JAPAN',
  portOfLoading: 'SHANGHAI, CHINA',
  exchangeRate: 150.5,
  exchangeDate: new Date().toISOString().split('T')[0],
  length: 120,
  width: 80,
  height: 100,
  actualNW: 250,
  actualGW: 280,
  offerNW: 250,
  offerGW: 280,
  deliveryDate: '2024-06-15',
  etd: '2024-05-20',
  seaFreightUnitActual: 50,
  seaFreightUnitOffer: 60,
  seaOtherActual: 10000,
  seaOtherOffer: 12000,
  airFreightActual: 150000,
  airFreightOffer: 180000,
  airOtherActual: 5000,
  airOtherOffer: 6000,
  purchasePriceSea: 1500000,
  purchasePriceAir: 1500000,
  commissionRate: 2,
  approver: '山田 太郎',
  reviewer: '佐藤 次郎',
  assignee: '鈴木 三郎',
};

const formatCurrency = (num: number) => Math.round(num).toLocaleString();

const useCalculations = (data: EstimateData) => {
  return useMemo(() => {
    const m3 = (data.length * data.width * data.height) / 1000000;
    const vw = m3 / 0.005;

    // Fixed Costs
    const customs = 5900;
    const handling = 8000;
    const cfsChcRate = data.category === 'seasoning' ? 5480 : 6580;
    const cfsChc = cfsChcRate * m3;

    // Sea Freight
    const seaFreightActual = data.seaFreightUnitActual * m3 * data.exchangeRate;
    const seaFreightOffer = data.seaFreightUnitOffer * m3 * data.exchangeRate;

    // Base Costs (Before Insurance)
    const baseSeaCostsActual = seaFreightActual + cfsChc + customs + handling + data.seaOtherActual;
    const baseSeaCostsOffer = seaFreightOffer + cfsChc + customs + handling + data.seaOtherOffer;

    const baseAirCostsActual = data.airFreightActual + customs + handling + data.airOtherActual;
    const baseAirCostsOffer = data.airFreightOffer + customs + handling + data.airOtherOffer;

    // Insurance Rates
    const plCpiRate = data.category === 'seasoning' ? 0.002 : 0;
    const bankGuaranteeRate = data.category === 'parts' ? 0.015 : 0;
    const marineInsuranceRate = 1.1 * 0.001; // 110% * 0.1%
    const totalInsuranceRate = plCpiRate + bankGuaranteeRate + marineInsuranceRate;

    const profitMarginDecimal = data.profitMargin / 100;

    // Sales Price Calculation
    // S = (P / (1 - R) + C_other) / (1 - InsRate)
    const salesPriceSea = data.purchasePriceSea > 0 
      ? (data.purchasePriceSea / (1 - profitMarginDecimal) + baseSeaCostsOffer) / (1 - totalInsuranceRate)
      : 0;
      
    const salesPriceAir = data.purchasePriceAir > 0
      ? (data.purchasePriceAir / (1 - profitMarginDecimal) + baseAirCostsOffer) / (1 - totalInsuranceRate)
      : 0;

    // Insurance Values
    const plCpiActualSea = salesPriceSea * plCpiRate;
    const bankGuaranteeActualSea = salesPriceSea * bankGuaranteeRate;
    const marineInsuranceActualSea = salesPriceSea * marineInsuranceRate;

    const plCpiActualAir = salesPriceAir * plCpiRate;
    const bankGuaranteeActualAir = salesPriceAir * bankGuaranteeRate;
    const marineInsuranceActualAir = salesPriceAir * marineInsuranceRate;

    // Total Costs
    const totalSeaCostsActual = baseSeaCostsActual + plCpiActualSea + bankGuaranteeActualSea + marineInsuranceActualSea;
    const totalSeaCostsOffer = baseSeaCostsOffer + plCpiActualSea + bankGuaranteeActualSea + marineInsuranceActualSea;

    const totalAirCostsActual = baseAirCostsActual + plCpiActualAir + bankGuaranteeActualAir + marineInsuranceActualAir;
    const totalAirCostsOffer = baseAirCostsOffer + plCpiActualAir + bankGuaranteeActualAir + marineInsuranceActualAir;

    // Profit Calculation
    const subtotalSea = salesPriceSea - data.purchasePriceSea;
    const commissionSea = salesPriceSea * (data.commissionRate / 100);
    const estimatedProfitSea = subtotalSea - totalSeaCostsActual - commissionSea;
    const estimatedProfitMarginSea = salesPriceSea > 0 ? (estimatedProfitSea / salesPriceSea) * 100 : 0;

    const subtotalAir = salesPriceAir - data.purchasePriceAir;
    const commissionAir = salesPriceAir * (data.commissionRate / 100);
    const estimatedProfitAir = subtotalAir - totalAirCostsActual - commissionAir;
    const estimatedProfitMarginAir = salesPriceAir > 0 ? (estimatedProfitAir / salesPriceAir) * 100 : 0;

    return {
      m3, vw, cfsChcRate,
      sea: {
        freightActual: seaFreightActual,
        freightOffer: seaFreightOffer,
        cfsChc,
        customs,
        handling,
        plCpi: plCpiActualSea,
        bankGuarantee: bankGuaranteeActualSea,
        marineInsurance: marineInsuranceActualSea,
        totalCostsActual: totalSeaCostsActual,
        totalCostsOffer: totalSeaCostsOffer,
        salesPrice: salesPriceSea,
        subtotal: subtotalSea,
        commission: commissionSea,
        estimatedProfit: estimatedProfitSea,
        estimatedProfitMargin: estimatedProfitMarginSea
      },
      air: {
        freightActual: data.airFreightActual,
        freightOffer: data.airFreightOffer,
        cfsChc: 0,
        customs,
        handling,
        plCpi: plCpiActualAir,
        bankGuarantee: bankGuaranteeActualAir,
        marineInsurance: marineInsuranceActualAir,
        totalCostsActual: totalAirCostsActual,
        totalCostsOffer: totalAirCostsOffer,
        salesPrice: salesPriceAir,
        subtotal: subtotalAir,
        commission: commissionAir,
        estimatedProfit: estimatedProfitAir,
        estimatedProfitMargin: estimatedProfitMarginAir
      }
    };
  }, [data]);
};

export default function App() {
  const [currentView, setCurrentView] = useState<'create' | 'dashboard' | 'history' | 'settings'>('create');
  const [step, setStep] = useState(1);
  const [data, setData] = useState<EstimateData>(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calc = useCalculations(data);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('pdf-content');
      if (!element) return;

      // Wait a tick to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const originalShadow = element.style.boxShadow;
      element.style.boxShadow = 'none';

      const imgData = await htmlToImage.toPng(element, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });

      element.style.boxShadow = originalShadow;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit within A4 landscape
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const pdfRatio = pdfWidth / pdfHeight;

      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;

      if (imgRatio > pdfRatio) {
        finalHeight = pdfWidth / imgRatio;
      } else {
        finalWidth = pdfHeight * imgRatio;
      }

      // Center the image on the PDF page
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save(`Estimate_${data.contactNo || 'draft'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDFの生成に失敗しました。');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    // Simulate AI processing delay
    setTimeout(() => {
      setData(prev => ({ ...prev, ...mockAiData }));
      setAiExtracted(true);
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleViewEstimate = (id: string) => {
    // Simulate loading data for the selected estimate
    setData(prev => ({ ...prev, ...mockAiData, contactNo: id }));
    setStep(3); // Go directly to the preview step
    setCurrentView('create');
  };

  const steps = [
    { id: 1, name: 'アップロード', icon: UploadCloud },
    { id: 2, name: 'データ入力・補正', icon: FileText },
    { id: 3, name: '計算結果プレビュー', icon: Calculator },
    { id: 4, name: '承認・出力', icon: CheckCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans print:bg-white print:h-auto">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col print:hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Anchor className="w-6 h-6 text-blue-400" />
            船積コスト見積
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <a 
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              setCurrentView('create'); 
              setStep(1);
              setData(initialData);
              setAiExtracted(false);
            }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", currentView === 'create' ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800")}
          >
            <Plus className="w-5 h-5" />
            新規見積作成
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", currentView === 'dashboard' ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800")}
          >
            <LayoutDashboard className="w-5 h-5" />
            ダッシュボード
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentView('history'); }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", currentView === 'history' ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800")}
          >
            <FileSpreadsheet className="w-5 h-5" />
            見積履歴
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentView('settings'); }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", currentView === 'settings' ? "bg-blue-600/20 text-blue-400" : "hover:bg-slate-800")}
          >
            <Settings className="w-5 h-5" />
            設定
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              KT
            </div>
            <div className="text-sm">
              <p className="text-white">Kotaro Tanaka</p>
              <p className="text-xs text-slate-500">担当者</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {currentView === 'create' && (
          <>
            {/* Header / Stepper */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 print:hidden">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                  {steps.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isPast = step > s.id;
                    return (
                      <div key={s.id} className="flex items-center">
                        <div className={cn(
                          "flex flex-col items-center gap-2",
                          isActive ? "text-blue-600" : isPast ? "text-slate-600" : "text-slate-400"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                            isActive ? "border-blue-600 bg-blue-50" : isPast ? "border-slate-600 bg-slate-50" : "border-slate-200"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium">{s.name}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={cn(
                            "w-24 h-0.5 mx-4",
                            isPast ? "bg-slate-600" : "bg-slate-200"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </header>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
              <div className="max-w-5xl mx-auto print:max-w-none print:w-full">
                
                {/* Step 1: Upload */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">書類をアップロード</h2>
                  <p className="text-slate-500">発注書(PO)、請求書、仕様書などのPDFまたは画像をドロップしてください。</p>
                </div>
                
                <div 
                  className={cn(
                    "w-full max-w-2xl border-2 border-dashed rounded-2xl p-12 text-center transition-all",
                    isProcessing ? "border-blue-400 bg-blue-50" : 
                    isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : 
                    "border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileInputChange} 
                    className="hidden" 
                    accept="application/pdf,image/jpeg,image/png" 
                  />
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                      <p className="text-lg font-medium text-blue-700">AIが書類を解析中...</p>
                      <p className="text-sm text-blue-500">項目を自動抽出しています</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-700">クリックまたはドラッグ＆ドロップ</p>
                        <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (最大 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Gemini Vision AIが書類から必要な情報を自動抽出します
                </div>
              </div>
            )}

            {/* Step 2: Data Entry */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">データ入力・補正</h2>
                    <p className="text-slate-500 mt-1">AIが抽出した内容を確認し、不足している項目を入力してください。</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      戻る
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      計算を実行
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {aiExtracted && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium">AIによる自動抽出が完了しました</p>
                      <p className="text-sm text-emerald-700 mt-0.5">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        マークが付いている項目はAIが書類から読み取った値です。内容を確認してください。
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {/* 案件基本情報 */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      案件基本情報
                    </h3>
                    <div className="space-y-4">
                      <InputField label="ESTIMATE / SALES CONTACT NO." name="contactNo" value={data.contactNo} onChange={handleChange} ai={aiExtracted} />
                      <InputField label="BUYER (買主)" name="buyer" value={data.buyer} onChange={handleChange} ai={aiExtracted} />
                      <InputField label="MAKER (メーカー)" name="maker" value={data.maker} onChange={handleChange} ai={aiExtracted} />
                      <InputField label="PRODUCT (商品名)" name="product" value={data.product} onChange={handleChange} ai={aiExtracted} />
                      
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-1">商品カテゴリ (計算ロジック切替)</label>
                        <select 
                          name="category" 
                          value={data.category} 
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="parts">部品・機械</option>
                          <option value="seasoning">調味料</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">※保険料率やCFS/CHC単価が自動で切り替わります</p>
                      </div>
                    </div>
                  </div>

                  {/* 取引・為替条件 */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                      取引・為替条件
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="利益率 (%)" name="profitMargin" type="number" value={data.profitMargin} onChange={handleChange} ai={aiExtracted} />
                        <InputField label="販売条件" name="salesTerms" value={data.salesTerms} onChange={handleChange} ai={aiExtracted} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">支払タイミング</label>
                          <select name="paymentTiming" value={data.paymentTiming} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                            <option value="前">前</option>
                            <option value="後">後</option>
                          </select>
                        </div>
                        <InputField label="日数" name="paymentDays" type="number" value={data.paymentDays} onChange={handleChange} ai={aiExtracted} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="建値条件 (Incoterms)" name="incoterms" value={data.incoterms} onChange={handleChange} ai={aiExtracted} />
                        <InputField label="向け地" name="destination" value={data.destination} onChange={handleChange} ai={aiExtracted} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <InputField label="為替レート (円/US$)" name="exchangeRate" type="number" value={data.exchangeRate} onChange={handleChange} ai={aiExtracted} />
                        <InputField label="為替レート適用日" name="exchangeDate" type="date" value={data.exchangeDate} onChange={handleChange} ai={aiExtracted} />
                      </div>
                    </div>
                  </div>

                  {/* 梱包・重量・納期 */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      梱包・重量・納期
                    </h3>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-600 border-b pb-2">梱包サイズ (cm)</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <InputField label="L" name="length" type="number" value={data.length} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="W" name="width" type="number" value={data.width} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="H" name="height" type="number" value={data.height} onChange={handleChange} ai={aiExtracted} />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500">M3 (容積)</p>
                          <p className="text-lg font-mono font-medium">{calc.m3.toFixed(3)}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-600 border-b pb-2">重量 (KG)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="実際NW" name="actualNW" type="number" value={data.actualNW} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="実際GW" name="actualGW" type="number" value={data.actualGW} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="OFFER用 仮NW" name="offerNW" type="number" value={data.offerNW} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="OFFER用 仮GW" name="offerGW" type="number" value={data.offerGW} onChange={handleChange} ai={aiExtracted} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-600 border-b pb-2">納期</h4>
                        <InputField label="納入日 (期限)" name="deliveryDate" type="date" value={data.deliveryDate} onChange={handleChange} ai={aiExtracted} />
                        <InputField label="ETD (出港予定日)" name="etd" type="date" value={data.etd} onChange={handleChange} ai={aiExtracted} />
                      </div>
                    </div>
                  </div>

                  {/* 諸経費・仕入値 */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-500" />
                      諸経費・仕入値入力
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-600 border-b pb-2 flex items-center gap-2">
                          <Anchor className="w-4 h-4" /> BY SEA
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="FREIGHT単価 ACTUAL (US$/M3)" name="seaFreightUnitActual" type="number" value={data.seaFreightUnitActual} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="FREIGHT単価 OFFER (US$/M3)" name="seaFreightUnitOffer" type="number" value={data.seaFreightUnitOffer} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="その他経費 ACTUAL (円)" name="seaOtherActual" type="number" value={data.seaOtherActual} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="その他経費 OFFER (円)" name="seaOtherOffer" type="number" value={data.seaOtherOffer} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="仕入値 (円)" name="purchasePriceSea" type="number" value={data.purchasePriceSea} onChange={handleChange} ai={aiExtracted} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-600 border-b pb-2 flex items-center gap-2">
                          <Plane className="w-4 h-4" /> BY AIR
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="AIR FREIGHT ACTUAL (円)" name="airFreightActual" type="number" value={data.airFreightActual} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="AIR FREIGHT OFFER (円)" name="airFreightOffer" type="number" value={data.airFreightOffer} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="その他経費 ACTUAL (円)" name="airOtherActual" type="number" value={data.airOtherActual} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="その他経費 OFFER (円)" name="airOtherOffer" type="number" value={data.airOtherOffer} onChange={handleChange} ai={aiExtracted} />
                          <InputField label="仕入値 (円)" name="purchasePriceAir" type="number" value={data.purchasePriceAir} onChange={handleChange} ai={aiExtracted} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 w-1/2 pr-4">
                      <InputField label="コミッション率 (%)" name="commissionRate" type="number" value={data.commissionRate} onChange={handleChange} ai={aiExtracted} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 & 4: Preview & Approval */}
            {(step === 3 || step === 4) && (
              <div className="space-y-6">
                {step === 3 && (
                  <div className="flex items-center justify-between mb-6 print:hidden">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">計算結果プレビュー</h2>
                      <p className="text-slate-500 mt-1">入力されたデータに基づくコスト計算書（ドラフト）です。</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setStep(2)}
                        className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        修正する
                      </button>
                      <button 
                        onClick={() => setStep(4)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        承認へ進む
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* The Excel-like Table */}
                <div className={cn(
                  "bg-slate-100 rounded-xl border border-slate-200 shadow-inner overflow-x-auto",
                  step === 4 ? "absolute -left-[9999px] top-0" : "w-full py-8 px-4"
                )}>
                  <div 
                    id="pdf-content" 
                    className="bg-white text-black text-[11px] leading-snug font-sans w-[1122px] min-h-[793px] p-12 shadow-lg mx-auto shrink-0 box-border"
                  >
                    <div className="w-full bg-white">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-end gap-3">
                        <h1 className="text-2xl font-bold border border-black pl-6 pr-8 py-2 tracking-wider">船積諸経費 & 見積</h1>
                        <span className="text-lg border border-black px-3 py-1">（コスト計算）</span>
                      </div>
                      <div className="flex border border-black">
                        <div className="w-24 border-r border-black flex flex-col">
                          <div className="text-center py-1 border-b border-black bg-slate-100 print:bg-transparent text-xs font-bold">決裁者</div>
                          <div className="h-16"></div>
                        </div>
                        <div className="w-24 border-r border-black flex flex-col">
                          <div className="text-center py-1 border-b border-black bg-slate-100 print:bg-transparent text-xs font-bold">確認者</div>
                          <div className="h-16"></div>
                        </div>
                        <div className="w-24 border-r border-black flex flex-col">
                          <div className="text-center py-1 border-b border-black bg-slate-100 print:bg-transparent text-xs font-bold">確認者</div>
                          <div className="h-16"></div>
                        </div>
                        <div className="w-24 flex flex-col">
                          <div className="text-center py-1 border-b border-black bg-slate-100 print:bg-transparent text-xs font-bold">担当者</div>
                          <div className="h-16"></div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-1.5 mb-6 text-sm">
                      <div className="flex items-center">
                        <div className="w-64 font-bold">ESTIMATE / SALES CONTACT NO. :</div>
                        <div className="flex-1 border border-black px-3 py-1 font-mono bg-slate-50 print:bg-transparent">{data.contactNo}</div>
                        <div className="w-64"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-64 font-bold">BUYER :</div>
                        <div className="flex-1 border border-black px-3 py-1 font-mono bg-slate-50 print:bg-transparent">{data.buyer}</div>
                        <div className="w-64"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-64 font-bold">MAKER :</div>
                        <div className="flex-1 border border-black px-3 py-1 font-mono bg-slate-50 print:bg-transparent">{data.maker}</div>
                        <div className="w-64"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-64 font-bold">PRODUCT :</div>
                        <div className="flex-1 border border-black px-3 py-1 font-mono bg-slate-50 print:bg-transparent">{data.product}</div>
                        <div className="w-64"></div>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="border border-black mb-6 flex text-sm">
                      <div className="w-1/2 border-r border-black">
                        <div className="flex border-b border-black">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">利益率 ①</div>
                          <div className="flex-1 p-2 font-mono font-bold">{data.profitMargin}%</div>
                        </div>
                        <div className="flex border-b border-black">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">販売条件</div>
                          <div className="flex-1 p-2 font-mono">{data.salesTerms} {data.paymentTiming} {data.paymentDays} 日</div>
                        </div>
                        <div className="flex">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">為替 ②</div>
                          <div className="flex-1 p-2 font-mono">¥{data.exchangeRate} / US$</div>
                        </div>
                      </div>
                      <div className="w-1/2">
                        <div className="flex border-b border-black">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">建値条件</div>
                          <div className="flex-1 p-2 font-mono">{data.incoterms}</div>
                        </div>
                        <div className="flex border-b border-black">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">向け地</div>
                          <div className="flex-1 p-2 font-mono">{data.destination}</div>
                        </div>
                        <div className="flex">
                          <div className="w-32 p-2 border-r border-black font-bold bg-slate-50">積地</div>
                          <div className="flex-1 p-2 font-mono">{data.portOfLoading}</div>
                        </div>
                      </div>
                    </div>

                    {/* Weights & Dimensions */}
                    <div className="border border-black mb-6 flex text-sm">
                      <div className="w-1/3 border-r border-black p-3 flex flex-col justify-between">
                        <div>
                          <div className="border-b border-black pb-1.5 mb-2 font-bold bg-slate-50 px-2">梱包サイズ( {data.length} L X {data.width} W X {data.height} H ) =</div>
                          <div className="text-right font-mono font-bold border-b border-black pb-1.5 mb-2 px-2">M3: {calc.m3.toFixed(3)}</div>
                          <div className="text-xs text-slate-600 px-2">*ボリューム勝ちか判定(エアーのみ)</div>
                        </div>
                        <div className="text-right font-mono font-bold border-b border-black pb-1.5 px-2">GW: {data.actualGW} KG</div>
                      </div>
                      <div className="w-1/3 border-r border-black p-3">
                        <div className="text-center font-bold mb-4 bg-slate-50 py-1 border-b border-black">実際の重量</div>
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div className="w-10 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">NW</div>
                          <div className="flex-1 mx-3 border border-black text-right px-3 py-1 font-mono">{data.actualNW}</div>
                          <div className="w-8 text-right">KG</div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <div className="w-10 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">GW</div>
                          <div className="flex-1 mx-3 border border-black text-right px-3 py-1 font-mono">{data.actualGW}</div>
                          <div className="w-8 text-right">KG</div>
                        </div>
                      </div>
                      <div className="w-1/3 p-3">
                        <div className="text-center font-bold mb-4 bg-slate-50 py-1 border-b border-black">OFFER用仮重量 / 納期</div>
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div className="w-10 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">NW</div>
                          <div className="flex-1 mx-3 border border-black text-right px-3 py-1 font-mono">{data.offerNW}</div>
                          <div className="w-8 text-right">KG</div>
                        </div>
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div className="w-10 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">GW</div>
                          <div className="flex-1 mx-3 border border-black text-right px-3 py-1 font-mono">{data.offerGW}</div>
                          <div className="w-8 text-right">KG</div>
                        </div>
                        <div className="flex items-center justify-between mb-2 px-2">
                          <div className="w-14 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">納入日</div>
                          <div className="flex-1 mx-3 border-b border-black text-right px-2 py-1 font-mono">{data.deliveryDate}</div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <div className="w-14 bg-slate-800 text-white text-center text-xs py-1 rounded-sm">ETD</div>
                          <div className="flex-1 mx-3 border-b border-black text-right px-2 py-1 font-mono">{data.etd}</div>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr>
                          <th className="border border-black p-2 bg-slate-50 print:bg-transparent w-[30%]">諸経費計算</th>
                          <th colSpan={2} className="border border-black p-2 bg-slate-50 print:bg-transparent w-[35%]">BY SEA</th>
                          <th colSpan={2} className="border border-black p-2 bg-slate-50 print:bg-transparent w-[35%]">AIR CARGO / DHL / FEDEX</th>
                        </tr>
                        <tr>
                          <th className="border border-black p-2 text-center bg-slate-50">項目</th>
                          <th className="border border-black p-2 text-center w-[17.5%] bg-slate-50">ACTUAL COST</th>
                          <th className="border border-black p-2 text-center w-[17.5%] bg-slate-50">OFFER(ﾀﾘﾌﾍﾞｰｽ)</th>
                          <th className="border border-black p-2 text-center w-[17.5%] bg-slate-50">ACTUAL COST</th>
                          <th className="border border-black p-2 text-center w-[17.5%] bg-slate-50">OFFER(ﾀﾘﾌﾍﾞｰｽ)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-right">
                        <TableRow label="FREIGHT(US$ /M3)" seaAct={calc.sea.freightActual} seaOff={calc.sea.freightOffer} airAct={calc.air.freightActual} airOff={calc.air.freightOffer} />
                        <TableRow label={`CFS+CHC(¥${calc.cfsChcRate})`} seaAct={calc.sea.cfsChc} seaOff={calc.sea.cfsChc} airAct={0} airOff={0} />
                        <TableRow label="乙仲費（通関費+船積諸掛）" seaAct={calc.sea.customs} seaOff={calc.sea.customs} airAct={calc.air.customs} airOff={calc.air.customs} />
                        <TableRow label="輸出取扱料" seaAct={calc.sea.handling} seaOff={calc.sea.handling} airAct={calc.air.handling} airOff={calc.air.handling} />
                        <TableRow label={data.category === 'parts' ? "BANK GUARANTEE (1.5%/年)" : "PL/CPI 保険 (0.2%/年)"} seaAct={calc.sea.bankGuarantee || calc.sea.plCpi} seaOff={calc.sea.bankGuarantee || calc.sea.plCpi} airAct={calc.air.bankGuarantee || calc.air.plCpi} airOff={calc.air.bankGuarantee || calc.air.plCpi} />
                        <TableRow label="海上保険 110% x 0.1%, 0.3%" seaAct={calc.sea.marineInsurance} seaOff={calc.sea.marineInsurance} airAct={calc.air.marineInsurance} airOff={calc.air.marineInsurance} />
                        <TableRow label="輸出梱包費・その他" seaAct={data.seaOtherActual} seaOff={data.seaOtherOffer} airAct={data.airOtherActual} airOff={data.airOtherOffer} />
                        
                        <tr className="border-t-2 border-black font-bold bg-slate-50">
                          <td className="border border-black p-2 text-left">諸経費合計</td>
                          <td className="border border-black p-2">{formatCurrency(calc.sea.totalCostsActual)}</td>
                          <td className="border border-black p-2">{formatCurrency(calc.sea.totalCostsOffer)}</td>
                          <td className="border border-black p-2">{formatCurrency(calc.air.totalCostsActual)}</td>
                          <td className="border border-black p-2">{formatCurrency(calc.air.totalCostsOffer)}</td>
                        </tr>

                        {data.category === 'parts' && (
                          <tr>
                            <td colSpan={5} className="border border-black p-2 text-left text-xs text-red-600 font-bold bg-red-50">
                              ※DHL・クーリエでバッテリーは出荷不可 / シリコンコーティング・ケミカル＊＊＊ 別表第二証明必要 明細要確認
                            </td>
                          </tr>
                        )}

                        <tr>
                          <th className="border border-black p-2 bg-slate-100 print:bg-transparent text-left">利益計算 利益率 = {data.profitMargin}%</th>
                          <th colSpan={2} className="border border-black p-2 bg-slate-100 print:bg-transparent text-center">BY SEA</th>
                          <th colSpan={2} className="border border-black p-2 bg-slate-100 print:bg-transparent text-center">BY AIR/DHL/クーリエ</th>
                        </tr>

                        <tr className="font-bold text-sm bg-blue-50">
                          <td className="border border-black p-2 text-left">売値(FOB+諸経費）</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.sea.salesPrice)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.air.salesPrice)}</td>
                        </tr>

                        <tr>
                          <td className="border border-black p-2 text-left">仕入値</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(data.purchasePriceSea)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(data.purchasePriceAir)}</td>
                        </tr>

                        <tr>
                          <td className="border border-black p-2 text-left bg-slate-50">小計(売値－仕入値）</td>
                          <td colSpan={2} className="border border-black p-2 text-center bg-slate-50">{formatCurrency(calc.sea.subtotal)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center bg-slate-50">{formatCurrency(calc.air.subtotal)}</td>
                        </tr>

                        <tr>
                          <td className="border border-black p-2 text-left">諸経費 (ACTUAL)</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.sea.totalCostsActual)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.air.totalCostsActual)}</td>
                        </tr>

                        <tr>
                          <td className="border border-black p-2 text-left">コミッション( {data.commissionRate}% )</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.sea.commission)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.air.commission)}</td>
                        </tr>

                        <tr className="font-bold bg-emerald-50 text-emerald-900">
                          <td className="border border-black p-2 text-left">見込み利益</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.sea.estimatedProfit)}</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{formatCurrency(calc.air.estimatedProfit)}</td>
                        </tr>

                        <tr className="font-bold bg-emerald-50 text-emerald-900">
                          <td className="border border-black p-2 text-left">見込み利益率</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{calc.sea.estimatedProfitMargin.toFixed(1)}%</td>
                          <td colSpan={2} className="border border-black p-2 text-center">{calc.air.estimatedProfitMargin.toFixed(1)}%</td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

                {/* Step 4: Approval */}
                {step === 4 && (
                  <div className="max-w-3xl mx-auto space-y-8 print:hidden">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">見積の準備が完了しました</h2>
                  <p className="text-slate-500 mt-2">承認ワークフローを開始するか、ファイルをダウンロードしてください。</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">承認ワークフロー</h3>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                    
                    <div className="flex flex-col items-center bg-white px-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">担当者</span>
                      <span className="text-xs text-slate-500">Kotaro Tanaka</span>
                    </div>

                    <div className="flex flex-col items-center bg-white px-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold mb-2">
                        2
                      </div>
                      <span className="text-sm font-medium">確認者</span>
                      <span className="text-xs text-slate-500">{data.reviewer || '未設定'}</span>
                    </div>

                    <div className="flex flex-col items-center bg-white px-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold mb-2">
                        3
                      </div>
                      <span className="text-sm font-medium">決裁者</span>
                      <span className="text-xs text-slate-500">{data.approver || '未設定'}</span>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      {isGeneratingPDF ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{isGeneratingPDF ? 'PDF作成中...' : 'PDFダウンロード'}</p>
                      <p className="text-xs text-slate-500">計算書フォーマット</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => alert('承認申請を送信しました。')}
                    className="flex items-center justify-center gap-3 p-6 bg-indigo-600 border border-indigo-700 rounded-xl hover:bg-indigo-700 transition-all group shadow-sm shadow-indigo-200"
                  >
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-lg flex items-center justify-center group-hover:bg-indigo-400 transition-colors">
                      <Send className="w-6 h-6" />
                    </div>
                    <div className="text-left text-white">
                      <p className="font-bold text-lg">承認申請する</p>
                      <p className="text-xs text-indigo-200">ワークフローへ送信</p>
                    </div>
                  </button>
                </div>
                
                <div className="text-center pt-4">
                  <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm underline">
                    最初からやり直す
                  </button>
                </div>
              </div>
            )}

              </div>
            )}

          </div>
        </div>
          </>
        )}

        {currentView === 'dashboard' && <DashboardView onViewEstimate={handleViewEstimate} />}
        {currentView === 'history' && <HistoryView onViewEstimate={handleViewEstimate} />}
        {currentView === 'settings' && (
          <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">設定</h2>
            <p className="text-slate-500 mt-2">設定画面は準備中です。</p>
          </div>
        )}
      </main>

      {/* Iframe Warning Modal */}
      {showIframeWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl mx-4">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-slate-900">別タブで開いてください</h3>
            </div>
            <div className="text-slate-600 space-y-3 mb-8 leading-relaxed">
              <p>
                現在のプレビュー画面では、ブラウザのセキュリティ制限により高画質なPDF出力（印刷機能）を起動できません。
              </p>
              <p>
                画面右上にある<strong>「新しいタブで開く」</strong>ボタン（四角から矢印が飛び出しているアイコン）をクリックして別タブでアプリを開き、再度ダウンロードをお試しください。
              </p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowIframeWarning(false)}
                className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ onViewEstimate }: { onViewEstimate: (id: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">今月の見積件数</p>
            <p className="text-3xl font-bold text-slate-900">24 <span className="text-sm font-normal text-slate-500">件</span></p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><ArrowRight className="w-3 h-3 -rotate-45" /> 前月比 +12%</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">承認待ち</p>
            <p className="text-3xl font-bold text-amber-600">5 <span className="text-sm font-normal text-amber-600/70">件</span></p>
            <p className="text-xs text-slate-500 mt-2">確認者・決裁者対応中</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">今月の見込み利益</p>
            <p className="text-3xl font-bold text-slate-900">¥4.2<span className="text-sm font-normal text-slate-500">M</span></p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><ArrowRight className="w-3 h-3 -rotate-45" /> 前月比 +5%</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">平均利益率</p>
            <p className="text-3xl font-bold text-blue-600">18.5<span className="text-sm font-normal text-blue-600/70">%</span></p>
            <p className="text-xs text-slate-500 mt-2">目標 15.0%</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">最近の活動</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { action: '見積書作成', target: 'EST-2024-045', user: 'Kotaro Tanaka', time: '10分前', status: '承認待ち' },
              { action: 'AIドラフト生成', target: 'EST-2024-046', user: 'System', time: '1時間前', status: '入力中' },
              { action: '決裁完了', target: 'EST-2024-042', user: '山田 太郎', time: '2時間前', status: '完了' },
              { action: '見積書作成', target: 'EST-2024-044', user: 'Kotaro Tanaka', time: '昨日', status: '承認待ち' },
            ].map((item, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => onViewEstimate(item.target)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.action}: {item.target}</p>
                    <p className="text-sm text-slate-500">担当: {item.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    item.status === '完了' ? "bg-emerald-100 text-emerald-700" :
                    item.status === '承認待ち' ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {item.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ onViewEstimate }: { onViewEstimate: (id: string) => void }) {
  const historyData = [
    { id: 'EST-2024-045', date: '2024-04-10', buyer: '株式会社グローバル商事', product: '産業用ロボットアーム X-200', profit: '¥185,000', margin: '18.5%', status: '承認待ち' },
    { id: 'EST-2024-044', date: '2024-04-09', buyer: 'Tech Solutions Inc.', product: 'サーバーラック SR-500', profit: '¥42,000', margin: '15.0%', status: '承認待ち' },
    { id: 'EST-2024-042', date: '2024-04-08', buyer: 'アジア食品株式会社', product: '業務用醤油 1000L', profit: '¥120,000', margin: '12.0%', status: '完了' },
    { id: 'EST-2024-041', date: '2024-04-05', buyer: 'Euro Manufacturing', product: '精密ギアボックス G-10', profit: '¥350,000', margin: '22.0%', status: '完了' },
    { id: 'EST-2024-040', date: '2024-04-02', buyer: '株式会社グローバル商事', product: 'コンベアベルト C-300', profit: '¥85,000', margin: '16.5%', status: '完了' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">見積履歴</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="見積番号や顧客名で検索..." className="px-4 py-2 border border-slate-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
              フィルター
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-600">見積番号</th>
                <th className="px-6 py-4 font-medium text-slate-600">作成日</th>
                <th className="px-6 py-4 font-medium text-slate-600">顧客名 (BUYER)</th>
                <th className="px-6 py-4 font-medium text-slate-600">商品名</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-right">見込み利益</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-right">利益率</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-center">ステータス</th>
                <th className="px-6 py-4 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onViewEstimate(row.id)}>
                  <td className="px-6 py-4 font-medium text-blue-600 hover:underline">{row.id}</td>
                  <td className="px-6 py-4 text-slate-600">{row.date}</td>
                  <td className="px-6 py-4 text-slate-900">{row.buyer}</td>
                  <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{row.product}</td>
                  <td className="px-6 py-4 text-slate-900 text-right font-mono">{row.profit}</td>
                  <td className="px-6 py-4 text-slate-900 text-right font-mono">{row.margin}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      row.status === '完了' ? "bg-emerald-100 text-emerald-700" :
                      row.status === '承認待ち' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
            <span>全 45 件中 1-5 件を表示</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-400 cursor-not-allowed">前へ</button>
              <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-700">次へ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ 
  label, name, value, onChange, type = "text", ai = false 
}: { 
  label: string, name: string, value: string | number, onChange: any, type?: string, ai?: boolean 
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
        {label}
        {ai && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> AI</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
      />
    </div>
  );
}

function TableRow({ label, seaAct, seaOff, airAct, airOff }: { label: string, seaAct: number, seaOff: number, airAct: number, airOff: number }) {
  return (
    <tr>
      <td className="border border-black p-2 text-left">{label}</td>
      <td className="border border-black p-2">{seaAct > 0 ? formatCurrency(seaAct) : ''}</td>
      <td className="border border-black p-2">{seaOff > 0 ? formatCurrency(seaOff) : ''}</td>
      <td className="border border-black p-2">{airAct > 0 ? formatCurrency(airAct) : ''}</td>
      <td className="border border-black p-2">{airOff > 0 ? formatCurrency(airOff) : ''}</td>
    </tr>
  );
}
