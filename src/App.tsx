import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Calculator, FileText, Plus, Trash2, Ship, Plane, Truck, ArrowRight, CheckCircle, UploadCloud, Loader2, LayoutDashboard, History, PlusCircle, Settings, Anchor, TrendingUp, Search, Filter, ChevronRight, ChevronLeft, Info } from 'lucide-react';

type Mode = 'SEA' | 'AIR' | 'COURIER';

const DashboardView = () => (
  <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-300">
    <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">今月の見積件数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-900">24</span>
            <span className="text-sm font-medium text-slate-500">件</span>
          </div>
          <div className="flex items-center mt-2 text-xs font-medium text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            前月比 +12%
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">承認待ち</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-amber-500">5</span>
            <span className="text-sm font-medium text-amber-500/70">件</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            確認者・決裁者対応中
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">今月の見込み利益</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-900">¥</span>
            <span className="text-4xl font-bold text-slate-900">4.2</span>
            <span className="text-sm font-medium text-slate-500">M</span>
          </div>
          <div className="flex items-center mt-2 text-xs font-medium text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            前月比 +5%
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">平均利益率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-blue-600">18.5</span>
            <span className="text-sm font-medium text-blue-600/70">%</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            目標 15.0%
          </div>
        </CardContent>
      </Card>
    </div>

    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-base font-semibold text-slate-800">最近の活動</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {[
            { title: '見積書作成: EST-2024-045', user: 'Kotaro Tanaka', status: '承認待ち', time: '10分前', statusColor: 'bg-amber-100 text-amber-800' },
            { title: 'AIドラフト生成: EST-2024-046', user: 'System', status: '入力中', time: '1時間前', statusColor: 'bg-slate-100 text-slate-600' },
            { title: '決裁完了: EST-2024-042', user: '山田 太郎', status: '完了', time: '2時間前', statusColor: 'bg-emerald-100 text-emerald-800' },
            { title: '見積書作成: EST-2024-044', user: 'Kotaro Tanaka', status: '承認待ち', time: '昨日', statusColor: 'bg-amber-100 text-amber-800' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">担当: {item.user}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${item.statusColor}`}>
                  {item.status}
                </span>
                <span className="text-xs text-slate-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const HistoryView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const historyData = [
    { id: 'EST-2024-045', date: '2024-04-10', client: '株式会社グローバル商事', product: '産業用ロボットアーム X-200', profit: '¥185,000', margin: '18.5%', status: '承認待ち', statusColor: 'bg-amber-100 text-amber-800' },
    { id: 'EST-2024-044', date: '2024-04-09', client: 'Tech Solutions Inc.', product: 'サーバーラック SR-500', profit: '¥42,000', margin: '15.0%', status: '承認待ち', statusColor: 'bg-amber-100 text-amber-800' },
    { id: 'EST-2024-042', date: '2024-04-08', client: 'アジア食品株式会社', product: '業務用醤油 1000L', profit: '¥120,000', margin: '12.0%', status: '完了', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'EST-2024-041', date: '2024-04-05', client: 'Euro Manufacturing', product: '精密ギアボックス G-10', profit: '¥350,000', margin: '22.0%', status: '完了', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'EST-2024-040', date: '2024-04-02', client: '株式会社グローバル商事', product: 'コンベアベルト C-300', profit: '¥85,000', margin: '16.5%', status: '完了', statusColor: 'bg-emerald-100 text-emerald-800' },
  ];

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">見積履歴</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="見積番号や顧客名で検索..." 
              className="pl-9 w-full sm:w-64 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべてのステータス</option>
            <option value="承認待ち">承認待ち</option>
            <option value="完了">完了</option>
          </select>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold">見積番号</TableHead>
                <TableHead className="font-semibold">作成日</TableHead>
                <TableHead className="font-semibold">顧客名 (BUYER)</TableHead>
                <TableHead className="font-semibold">商品名</TableHead>
                <TableHead className="text-right font-semibold">見込み利益</TableHead>
                <TableHead className="text-right font-semibold">利益率</TableHead>
                <TableHead className="text-center font-semibold">ステータス</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, i) => (
                <TableRow key={i} className="hover:bg-slate-50 cursor-pointer">
                  <TableCell className="font-medium text-blue-600">{row.id}</TableCell>
                  <TableCell className="text-slate-600">{row.date}</TableCell>
                  <TableCell className="text-slate-900">{row.client}</TableCell>
                  <TableCell className="text-slate-600">{row.product}</TableCell>
                  <TableCell className="text-right font-medium text-slate-900">{row.profit}</TableCell>
                  <TableCell className="text-right text-slate-600">{row.margin}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    該当する見積が見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            全 {filteredData.length} 件中 1-{Math.min(5, filteredData.length)} 件を表示
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white" disabled>
              前へ
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white" disabled={filteredData.length <= 5}>
              次へ
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const InternalCalculationSheet = ({ basicInfo, calculation }: { basicInfo: any; calculation: any }) => {
  if (!calculation) return null;
  
  return (
    <div id="calculation-preview-pdf" className="bg-white p-10 rounded-none border border-[#0f172a] shadow-none space-y-6 max-w-[210mm] mx-auto text-[10px] leading-tight font-sans text-[#0f172a]">
      {/* PDF Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-xl font-bold pb-1 inline-block">船積諸経費 ＆ 見積　　（コスト計算書）</h1>
        </div>
        <div className="flex border border-[#0f172a] text-center text-[9px]">
          <div className="border-r border-[#0f172a] w-14">
            <div className="border-b border-[#0f172a] py-0.5 bg-[#f8fafc]">決裁者</div>
            <div className="h-10"></div>
          </div>
          <div className="border-r border-[#0f172a] w-14">
            <div className="border-b border-[#0f172a] py-0.5 bg-[#f8fafc]">確認者</div>
            <div className="h-10"></div>
          </div>
          <div className="w-14">
            <div className="border-b border-[#0f172a] py-0.5 bg-[#f8fafc]">担当者</div>
            <div className="h-10"></div>
          </div>
        </div>
      </div>

      <div className="space-y-0.5 max-w-md">
        <div className="flex border-b border-[#cbd5e1] py-0.5">
          <span className="w-40 font-bold">ESTIMATE / SALES CONTACT NO. :</span>
          <span className="flex-1">{basicInfo.estimateNo || '---'}</span>
        </div>
        <div className="flex border-b border-[#cbd5e1] py-0.5">
          <span className="w-40 font-bold">BUYER :</span>
          <span className="flex-1">{basicInfo.buyer || '---'}</span>
        </div>
        <div className="flex border-b border-[#cbd5e1] py-0.5">
          <span className="w-40 font-bold">MAKER :</span>
          <span className="flex-1">{basicInfo.maker || '---'}</span>
        </div>
        <div className="flex border-b border-[#cbd5e1] py-0.5">
          <span className="w-40 font-bold">PRODUCT :</span>
          <span className="flex-1">{basicInfo.productName || '---'}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 border-t border-l border-[#0f172a]">
        <div className="border-b border-r border-[#0f172a] divide-y divide-[#0f172a]">
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">利益率 ①</div>
            <div className="px-2">{basicInfo.profitMargin || 0}% / その他 ( )</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">販売条件</div>
            <div className="px-2">{basicInfo.paymentTerms || '---'} {basicInfo.paymentDays ? `${basicInfo.paymentDays} 日` : ''}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">為替 A/S RATE</div>
            <div className="px-2">TTS: ¥ {basicInfo.exchangeRate || 0} / A/S: ¥ {basicInfo.asRate || '---'}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">梱包サイズ</div>
            <div className="px-2">
              {Array.isArray(basicInfo.packages) ? basicInfo.packages.map((p: any, i: number) => `${p.length || 0}x${p.width || 0}x${p.height || 0}`).join(', ') : '---'} = {(calculation.m3 || 0).toFixed(3)} M3
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">実際の重量</div>
            <div className="px-2">NW: {calculation.nw || 0} KG / GW: {calculation.gw || 0} KG</div>
          </div>
        </div>
        <div className="border-b border-r border-[#0f172a] divide-y divide-[#0f172a]">
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">建値条件</div>
            <div className="px-2">{basicInfo.incoterms || '---'}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">向け地</div>
            <div className="px-2">{basicInfo.destination || '---'}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">積地</div>
            <div className="px-2">{basicInfo.loadingPort || '---'}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">OFFER用仮重量</div>
            <div className="px-2">NW: {calculation.offerNW || 0} KG / GW: {calculation.offerGW || 0} KG</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] h-6 items-center">
            <div className="bg-[#f8fafc] h-full flex items-center px-2 border-r border-[#0f172a] font-bold">納期</div>
            <div className="px-2">納入日: {basicInfo.deliveryDate || '---'} / ETD: {basicInfo.etd || '---'}</div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="border border-[#0f172a]">
        <div className="grid grid-cols-[1fr_120px_120px_120px_120px] bg-[#f1f5f9] font-bold border-b border-[#0f172a] text-center items-center h-8">
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">項目</div>
          <div className="col-span-2 border-r border-[#0f172a] h-full flex items-center justify-center">BY SEA</div>
          <div className="col-span-2 h-full flex items-center justify-center">AIR CARGO / DHL / クーリエ</div>
        </div>
        <div className="grid grid-cols-[1fr_120px_120px_120px_120px] bg-[#f8fafc] border-b border-[#0f172a] text-[9px] text-center items-center h-6">
          <div className="border-r border-[#0f172a] h-full"></div>
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">ACTUAL COST</div>
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">OFFER(ﾀﾘﾌﾍﾞｰｽ)</div>
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">ACTUAL COST</div>
          <div className="h-full flex items-center justify-center">OFFER(ﾀﾘﾌﾍﾞｰｽ)</div>
        </div>
        <div className="divide-y divide-[#0f172a]">
          {Array.isArray(calculation.results) && calculation.results.map((r: any, idx: number) => (
            <div key={idx} className="grid grid-cols-[1fr_120px_120px_120px_120px] h-7 items-center">
              <div className="px-2 border-r border-[#0f172a] h-full flex items-center">{r.name}</div>
              <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">{(r.actual || 0).toLocaleString()}</div>
              <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end font-bold">{(r.offer || 0).toLocaleString()}</div>
              <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">---</div>
              <div className="text-right px-2 h-full flex items-center justify-end">---</div>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_120px_120px_120px_120px] h-8 items-center bg-[#f8fafc] font-bold">
            <div className="px-2 border-r border-[#0f172a] h-full flex items-center">諸経費合計</div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">{(calculation.totalExpensesActual || 0).toLocaleString()}</div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end text-[#1d4ed8]">{(calculation.totalExpensesOffer || 0).toLocaleString()}</div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">---</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---</div>
          </div>
        </div>
      </div>

      {/* Profit Calculation Section */}
      <div className="border border-[#0f172a]">
        <div className="grid grid-cols-[200px_1fr_150px_150px] bg-[#f1f5f9] font-bold border-b border-[#0f172a] text-center h-8 items-center">
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">利益計算</div>
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">FOB = 仕入 ÷ 利益率①</div>
          <div className="border-r border-[#0f172a] h-full flex items-center justify-center">BY SEA</div>
          <div className="h-full flex items-center justify-center">BY AIR/DHL</div>
        </div>
        <div className="divide-y divide-[#0f172a]">
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-8 items-center">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">売値(FOB+諸経費)</div>
            <div className="px-2 border-r border-[#0f172a] text-center h-full flex items-center justify-center">¥ {(calculation.fobPrice || 0).toLocaleString()} + ¥ {(calculation.totalExpensesOffer || 0).toLocaleString()}</div>
            <div className="text-right px-2 border-r border-[#0f172a] font-bold h-full flex items-center justify-end">¥ {(calculation.grandTotal || 0).toLocaleString()}</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---</div>
          </div>
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-16 items-center">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">仕入値</div>
            <div className="px-2 border-r border-[#0f172a] h-full"></div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-end justify-end pb-1">¥ {(calculation.totalCost || 0).toLocaleString()}</div>
            <div className="text-right px-2 h-full flex items-end justify-end pb-1">---</div>
          </div>
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-8 items-center">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">小計(売値－仕入値)</div>
            <div className="px-2 border-r border-[#0f172a] h-full"></div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">¥ {((calculation.grandTotal || 0) - (calculation.totalCost || 0)).toLocaleString()}</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---</div>
          </div>
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-8 items-center">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">諸経費</div>
            <div className="px-2 border-r border-[#0f172a] h-full"></div>
            <div className="text-right px-2 border-r border-[#0f172a] h-full flex items-center justify-end">¥ {(calculation.totalExpensesActual || 0).toLocaleString()}</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---</div>
          </div>
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-8 items-center">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">見込み利益</div>
            <div className="px-2 border-r border-[#0f172a] h-full"></div>
            <div className="text-right px-2 border-r border-[#0f172a] font-bold text-[#059669] h-full flex items-center justify-end">¥ {((calculation.grandTotal || 0) - (calculation.totalCost || 0) - (calculation.totalExpensesActual || 0)).toLocaleString()}</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---</div>
          </div>
          <div className="grid grid-cols-[200px_1fr_150px_150px] h-8 items-center border-t-2 border-[#0f172a]">
            <div className="px-2 border-r border-[#0f172a] bg-[#f8fafc] font-bold h-full flex items-center">見込み利益率</div>
            <div className="px-2 border-r border-[#0f172a] h-full"></div>
            <div className="text-right px-2 border-r border-[#0f172a] font-bold text-[#059669] h-full flex items-center justify-end">{(calculation.expectedProfitRate || 0).toFixed(2)}%</div>
            <div className="text-right px-2 h-full flex items-center justify-end">---%</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[9px] text-[#64748b] pt-4">
        <span>更新日：{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>C:\Users\Export\Costs_Calculation_Sheet.pdf</span>
      </div>
    </div>
  );
};

const OfficialEstimateSheet = ({ basicInfo, calculation }: { basicInfo: any; calculation: any }) => {
  if (!calculation) return null;

  return (
    <div id="official-estimate-pdf" className="bg-white p-12 shadow-lg mx-auto w-[210mm] min-h-[297mm] text-[#0f172a] font-serif border border-[#e2e8f0]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tighter">TTC FOODS CO., LTD.</h1>
          <p className="text-[10px] leading-tight">
            1-2-3, SHIN-YOKOHAMA, KOHOKU-KU, YOKOHAMA, 222-0033 JAPAN<br />
            TEL: 045-123-4567 FAX: 045-123-4568
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold pb-1 mb-4 tracking-[0.2em]">ESTIMATE</h2>
          <div className="text-[11px] space-y-1">
            <div className="flex justify-end space-x-4">
              <span className="font-bold">NO.:</span>
              <span className="min-w-[100px] border-b border-[#94a3b8] text-left pb-1 inline-block">{basicInfo.estimateNo || '---'}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <span className="font-bold">DATE:</span>
              <span className="min-w-[100px] border-b border-[#94a3b8] text-left pb-1 inline-block">{basicInfo.date || '---'}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <span className="font-bold">PAGE:</span>
              <span className="min-w-[100px] border-b border-[#94a3b8] text-left pb-1 inline-block">1 / 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 gap-4 mb-8 text-[11px]">
        <div className="flex items-baseline">
          <span className="w-40 font-bold">MESSERS:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.buyer || '---'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-40 font-bold">PLACE OF DELIVERY:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.destination || '---'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-40 font-bold">TIME OF SHIPMENT:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.shipmentTime || '---'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-40 font-bold">TERMS OF PAYMENT:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.paymentTerms || '---'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-40 font-bold">PACKING:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.packing || '---'}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-40 font-bold">OFFER VALIDITY:</span>
          <span className="flex-1 border-b border-[#94a3b8] pb-1 inline-block">{basicInfo.validity || '---'}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse mb-8 text-[11px]">
        <thead>
          <tr className="border-y-2 border-[#0f172a]">
            <th className="py-2 text-left w-12">NO.</th>
            <th className="py-2 text-left">DESCRIPTION OF GOODS</th>
            <th className="py-2 text-right w-24">Q'TY</th>
            <th className="py-2 text-right w-32">UNIT PRICE</th>
            <th className="py-2 text-right w-32">AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          <tr className="align-top">
            <td className="py-4">1</td>
            <td className="py-4 space-y-1">
              <div className="font-bold">{basicInfo.productName || '---'}</div>
              <div className="text-[10px] text-[#475569] whitespace-pre-wrap">{basicInfo.specification || '---'}</div>
              <div className="text-[9px] pt-2 space-y-0.5">
                {Array.isArray(basicInfo.packages) && basicInfo.packages.map((p: any, i: number) => (
                  <div key={i}>
                    {i+1}) {p.length || 0} x {p.width || 0} x {p.height || 0} cm / {p.weight || 0} KG x {p.quantity || 0} CTNS
                  </div>
                ))}
                <div className="pt-1 font-medium">
                  TOTAL GW: {(calculation.gw || 0).toLocaleString()} KG / TOTAL VOL: {(calculation.m3 || 0).toFixed(3)} M3
                </div>
              </div>
            </td>
            <td className="py-4 text-right">
              {(basicInfo.quantity || 0).toLocaleString()} {basicInfo.unit || 'KGS'}
            </td>
            <td className="py-4 text-right">
              <div className="flex justify-between px-2">
                <span>JPY</span>
                <span>{(calculation.unitPrice || 0).toLocaleString()}</span>
              </div>
            </td>
            <td className="py-4 text-right font-bold">
              <div className="flex justify-between px-2">
                <span>JPY</span>
                <span>{(calculation.grandTotal || 0).toLocaleString()}</span>
              </div>
            </td>
          </tr>
          {/* Empty rows to fill space */}
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="h-12">
              <td colSpan={5}></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#0f172a] font-bold">
            <td colSpan={4} className="py-3 text-right pr-4">TOTAL AMOUNT ({basicInfo.incoterms || '---'} {basicInfo.destination || '---'})</td>
            <td className="py-3 text-right">
              <div className="flex justify-between px-2">
                <span>JPY</span>
                <span>{(calculation.grandTotal || 0).toLocaleString()}</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-8 pt-8 border-t border-[#e2e8f0]">
        <div className="flex justify-between items-end">
          <div className="space-y-1 text-[10px]">
            <p className="font-bold">BANK DETAILS:</p>
            <p>BANK NAME: THE BANK OF YOKOHAMA, LTD.</p>
            <p>BRANCH: SHIN-YOKOHAMA BRANCH</p>
            <p>ACCOUNT NO.: (SAVING) 1234567</p>
            <p>ACCOUNT NAME: TTC FOODS CO., LTD.</p>
          </div>
          <div className="text-center w-48 space-y-12">
            <p className="text-xs">Yours faithfully,</p>
            <div className="border-b border-[#0f172a] pb-1 font-bold">TTC FOODS CO., LTD.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'history'>('create');
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<Mode>('SEA');
  const [viewMode, setViewMode] = useState<'internal' | 'official'>('internal');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basicInfo, setBasicInfo] = useState({
    estimateNo: '25-FDE-205',
    date: new Date().toISOString().split('T')[0],
    buyer: 'PT. GLINTERNATIONAL',
    maker: '',
    productName: 'MATCHA POWDER SP-602',
    specification: '1KG X 20PCS/CTN',
    profitMargin: 15,
    incoterms: 'FOB',
    destination: 'FOB JAKARTA, INDONESIA',
    shipmentTime: 'CONFIRM LATER',
    paymentTerms: 'T/T IN ADVANCE',
    paymentDays: '',
    packing: 'PACKAGING BY STANDARD EXPORT PACKING',
    validity: '90 DAYS FROM THE ABOVE DATE',
    exchangeRate: 148,
    asRate: 0,
    packages: [{ length: 40, width: 30, height: 25, weight: 20, quantity: 15 }],
    unitPrice: 0,
    quantity: 300,
    deliveryDate: '',
    unit: 'KGS',
    loadingPort: 'Yokohama, Japan',
    etd: '',
    actualNW: 0,
    actualGW: 0,
    offerNW: 0,
    offerGW: 0,
    volumeWeight: 0,
    calcGW: 0,
    commissionRate: 0,
  });

  const [extractedCosts, setExtractedCosts] = useState({
    freightUsd: 0,
    freightJpy: 0,
    cfsThc: 0,
    exportHandlingFee: 0,
    exportHandlingVolume: 0,
    drc: 0,
    blFee: 0,
    warehousingFee: 0,
    explosiveInspectionFee: 0,
    securityHandlingFee: 0,
    awbFee: 0,
    fuelCharge: 0,
    peakSeasonSurcharge: 0,
    dockingCharge: 0,
  });

  const [manualCosts, setManualCosts] = useState<Record<string, { actual: number; offer: number; multiplier: number }>>({
    freight: { actual: 0, offer: 0, multiplier: 1.2 },
    cfsThc: { actual: 0, offer: 0, multiplier: 1.0 },
    handling: { actual: 0, offer: 0, multiplier: 1.0 },
    warehousing: { actual: 0, offer: 0, multiplier: 1.1 },
    inspection: { actual: 0, offer: 0, multiplier: 1.1 },
    security: { actual: 0, offer: 0, multiplier: 1.1 },
    awbFee: { actual: 0, offer: 0, multiplier: 1.1 },
    bankCharge: { actual: 0, offer: 0, multiplier: 1.0 },
    insurance: { actual: 0, offer: 0, multiplier: 3.0 },
    domestic: { actual: 0, offer: 0, multiplier: 1.2 },
    packing: { actual: 0, offer: 0, multiplier: 1.2 },
    other: { actual: 0, offer: 0, multiplier: 2.0 },
    customsClearance: { actual: 5900, offer: 11800, multiplier: 2.0 },
    blFee: { actual: 0, offer: 0, multiplier: 1.1 },
    drc: { actual: 0, offer: 0, multiplier: 1.1 },
    fuel: { actual: 0, offer: 0, multiplier: 1.5 },
    peakSeason: { actual: 0, offer: 0, multiplier: 1.5 },
    docking: { actual: 0, offer: 0, multiplier: 1.1 },
    bankGuarantee: { actual: 0, offer: 0, multiplier: 1.0 },
    totalExpensesOfferOverride: { actual: 0, offer: 0, multiplier: 1.0 },
  });
  const [manualOverrides, setManualOverrides] = useState<Record<string, { actual?: boolean; offer?: boolean; multiplier?: boolean }>>({});
  const [bankChargeOverride, setBankChargeOverride] = useState<string | number>('');

  const handleExportPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed', error);
    }
  };

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: ['productName', 'paymentTerms', 'unit', 'destination', 'estimateNo', 'buyer', 'maker', 'deliveryDate', 'date', 'loadingPort', 'etd', 'shipmentTime', 'packing', 'validity', 'specification'].includes(name) ? value : Number(value) }));
  };

  const handleManualCostChange = (key: string, field: 'actual' | 'offer' | 'multiplier', value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setManualCosts(prev => {
      const current = prev[key] || { actual: 0, offer: 0, multiplier: 1.0 };
      const next = { ...current, [field]: numValue };
      
      // If multiplier or actual changes, and offer wasn't manually overridden in this specific turn,
      // we can optionally update the offer value in state too, but useMemo handles the display.
      // However, to make it feel responsive if they edit offer later, we keep track of overrides.
      return { ...prev, [key]: next };
    });

    setManualOverrides(prev => {
      const newOverrides = { ...prev };
      if (!newOverrides[key]) newOverrides[key] = {};
      
      newOverrides[key][field] = true;
      
      // If multiplier is edited, we want the calculation to use the new multiplier
      // and potentially override a previously manually set offer.
      if (field === 'multiplier') {
        newOverrides[key].offer = false;
      }
      // If offer is edited, it stays overridden.
      
      return newOverrides;
    });
  };

  const handlePackageChange = (index: number, field: string, value: string) => {
    setBasicInfo(prev => {
      const newPackages = [...prev.packages];
      newPackages[index] = { ...newPackages[index], [field]: Number(value) };
      return { ...prev, packages: newPackages };
    });
  };

  const addPackage = () => {
    setBasicInfo(prev => ({
      ...prev,
      packages: [...prev.packages, { length: 0, width: 0, height: 0, weight: 0, quantity: 1 }]
    }));
  };

  const removePackage = (index: number) => {
    setBasicInfo(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Convert file to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Call Gemini API
      const response = await fetch('/api/extract-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mimeType: file.type,
          data: base64Data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const isApiKeyError = response.status === 401 || 
                             errorData.code === 'API_KEY_MISSING' || 
                             errorData.code === 'API_KEY_INVALID' || 
                             (errorData.error && errorData.error.includes('API key'));
                             
        if (isApiKeyError) {
          // Check if window.aistudio is available
          if (typeof window !== 'undefined' && (window as any).aistudio) {
            const aistudio = (window as any).aistudio;
            // Use a non-blocking way if possible, but openSelectKey is key
            console.warn('API key invalid or missing. Opening selection dialog.');
            try {
              await aistudio.openSelectKey();
            } catch (e) {
              console.error('Failed to open API key selection dialog:', e);
            }
            throw new Error('APIキーが無効、または設定されていません。APIキーを選択してから再度アップロードしてください。');
          } else {
            throw new Error('APIキーが無効です。管理者に連絡してください。');
          }
        }
        throw new Error(errorData.error || 'Failed to extract data');
      }

      const extractedData = await response.json();

      // 3. Update state with extracted data
      setExtractedCosts({
        freightUsd: extractedData.freightUsd || 0,
        freightJpy: extractedData.freightJpy || 0,
        cfsThc: extractedData.cfsThc || 0,
        exportHandlingFee: extractedData.exportHandlingFee || 0,
        exportHandlingVolume: extractedData.exportHandlingVolume || 0,
        drc: extractedData.drc || 0,
        blFee: extractedData.blFee || 0,
        warehousingFee: extractedData.warehousingFee || 0,
        explosiveInspectionFee: extractedData.explosiveInspectionFee || 0,
        securityHandlingFee: extractedData.securityHandlingFee || 0,
        awbFee: extractedData.awbFee || 0,
        fuelCharge: extractedData.fuelCharge || 0,
        peakSeasonSurcharge: extractedData.peakSeasonSurcharge || 0,
        dockingCharge: extractedData.dockingCharge || 0,
      });

      setBasicInfo(prev => ({
        ...prev,
        destination: extractedData.destination || prev.destination,
        productName: extractedData.productName || prev.productName,
        estimateNo: extractedData.estimateNo || prev.estimateNo,
        buyer: extractedData.buyer || prev.buyer,
        maker: extractedData.maker || prev.maker,
        incoterms: extractedData.incoterms || prev.incoterms,
        paymentTerms: extractedData.paymentTerms || prev.paymentTerms,
        loadingPort: extractedData.loadingPort || prev.loadingPort,
        deliveryDate: extractedData.deliveryDate || prev.deliveryDate,
        etd: extractedData.etd || prev.etd,
        quantity: extractedData.quantity || prev.quantity,
        packages: extractedData.packages && extractedData.packages.length > 0 ? extractedData.packages : prev.packages,
      }));

      const calcExchangeRate = (extractedData.exchangeRate || 148) + 5;
      
      const newManualCosts: Partial<Record<string, { actual: number; offer: number; multiplier: number }>> = {
        freight: { 
          actual: mode === 'SEA' ? Math.round((extractedData.freightUsd || 0) * calcExchangeRate) : (extractedData.freightJpy || 0),
          offer: mode === 'SEA' ? Math.round((extractedData.freightUsd || 0) * calcExchangeRate * 1.2) : Math.round((extractedData.freightJpy || 0) * 1.5),
          multiplier: mode === 'SEA' ? 1.2 : 1.5
        },
        cfsThc: { actual: extractedData.cfsThc || 0, offer: extractedData.cfsThc || 0, multiplier: 1.0 },
        handling: { actual: extractedData.exportHandlingFee || 0, offer: extractedData.exportHandlingFee || 0, multiplier: 1.0 },
        warehousing: { actual: extractedData.warehousingFee || 0, offer: Math.round((extractedData.warehousingFee || 0) * 1.1), multiplier: 1.1 },
        inspection: { actual: extractedData.explosiveInspectionFee || 0, offer: Math.round((extractedData.explosiveInspectionFee || 0) * 1.1), multiplier: 1.1 },
        security: { actual: extractedData.securityHandlingFee || 0, offer: Math.round((extractedData.securityHandlingFee || 0) * 1.1), multiplier: 1.1 },
        awbFee: { actual: extractedData.awbFee || 0, offer: Math.round((extractedData.awbFee || 0) * 1.1), multiplier: 1.1 },
        bankCharge: { actual: 0, offer: 0, multiplier: 0 }, // Will be calculated in useMemo if not set
        insurance: { actual: 0, offer: 0, multiplier: 0 }, // Will be calculated in useMemo if not set
        domestic: { actual: 0, offer: 0, multiplier: 1.2 },
        packing: { actual: 0, offer: 0, multiplier: 1.2 },
        other: { actual: 0, offer: 0, multiplier: 2.0 },
        customsClearance: { actual: extractedData.customsClearance || 5900, offer: (extractedData.customsClearance || 5900) * 2, multiplier: 2.0 },
        blFee: { actual: extractedData.blFee || 0, offer: Math.round((extractedData.blFee || 0) * 1.1), multiplier: 1.1 },
        drc: { actual: extractedData.drc || 0, offer: Math.round((extractedData.drc || 0) * 1.1), multiplier: 1.1 },
        fuel: { actual: extractedData.fuelCharge || 0, offer: Math.round((extractedData.fuelCharge || 0) * 1.5), multiplier: 1.5 },
        peakSeason: { actual: extractedData.peakSeasonSurcharge || 0, offer: Math.round((extractedData.peakSeasonSurcharge || 0) * 1.5), multiplier: 1.5 },
        docking: { actual: extractedData.dockingCharge || 0, offer: Math.round((extractedData.dockingCharge || 0) * 1.1), multiplier: 1.1 },
        bankGuarantee: { actual: 0, offer: 0, multiplier: 1.0 },
      };

      setManualCosts(prev => ({ ...prev, ...newManualCosts }));

      setIsProcessing(false);
      setHasUploaded(true);
      setCurrentStep(2);

    } catch (err: any) {
      console.error("Error processing file:", err);
      setIsProcessing(false);
      setError(err.message || "ファイルの読み取りに失敗しました。");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const calculation = useMemo(() => {
    const missingItems: string[] = [];
    
    // バリデーション
    if (!basicInfo.unitPrice) missingItems.push('仕入値単価');
    if (!basicInfo.quantity) missingItems.push('数量');
    if (!basicInfo.exchangeRate) missingItems.push('為替レート');
    if (!basicInfo.paymentTerms) missingItems.push('販売条件 (T/T, L/C 等)');
    if (basicInfo.packages.some(p => !p.length || !p.width || !p.height)) missingItems.push('梱包サイズ (L, W, H)');
    if (basicInfo.packages.some(p => !p.weight)) missingItems.push('GW (実重量)');

    // 共通計算
    const profitMarginFactor = 1 - (basicInfo.profitMargin / 100);
    const calcExchangeRate = basicInfo.exchangeRate + 5;
    
    // Calculate totals from packages
    const totalM3 = basicInfo.packages.reduce((acc, p) => acc + ((p.length || 0) * (p.width || 0) * (p.height || 0) * (p.quantity || 0)) / 1000000, 0) || 0;
    const totalGW = basicInfo.packages.reduce((acc, p) => acc + ((p.weight || 0) * (p.quantity || 0)), 0) || 0;
    
    // Use manual overrides if provided
    const m3 = totalM3 || 0;
    const gw = basicInfo.actualGW || totalGW || 0;
    const nw = basicInfo.actualNW || (totalGW * 0.9) || 0;
    
    const volumeWeight = basicInfo.volumeWeight || (m3 / 0.005) || 0;
    const chargeableWeight = Math.max(volumeWeight, gw) || 0;

    // Offer weights
    const offerGW = basicInfo.offerGW || gw || 0;
    const offerNW = basicInfo.offerNW || nw || 0;
    const offerChargeableWeight = Math.max(volumeWeight, offerGW) || 0;
    
    const totalCost = (basicInfo.unitPrice || 0) * (basicInfo.quantity || 0);
    
    // FOB価格（商品売値）
    const fobPrice = profitMarginFactor > 0 ? Math.round(totalCost / profitMarginFactor) : 0;

    // 諸経費の集計
    let expensesActual = 0;
    let expensesOffer = 0;
    const results: any[] = [];

    const addExpense = (name: string, key: string, defaultActual: number, defaultMarkup: number, isMarkup: boolean = true, isExtracted: boolean = false) => {
      const manual = manualCosts[key] || { actual: 0, offer: 0, multiplier: defaultMarkup || 1.0 };
      const overrides = manualOverrides[key] || {};
      
      let actual = overrides.actual ? manual.actual : (defaultActual || 0);
      const multiplier = overrides.multiplier ? manual.multiplier : (defaultMarkup || 1.0);
      
      // Special case for Bank Charge and Insurance if not manually set
      if (key === 'bankCharge' && !overrides.actual && !overrides.offer) {
        if (bankChargeOverride !== '') {
          actual = Number(bankChargeOverride);
        } else {
          if (basicInfo.paymentTerms === 'T/T') {
            actual = fobPrice <= 1000000 ? 2500 : 4500;
          } else if (basicInfo.paymentTerms === 'L/C') {
            actual = 10000;
          }
        }
      }

      if (key === 'insurance' && !overrides.actual && !overrides.offer) {
        const insuranceBase = totalCost + expensesActual;
        actual = Math.round(insuranceBase * 1.1 * 0.001);
      }

      let offer = overrides.offer ? manual.offer : (isMarkup ? Math.round(actual * multiplier) : (overrides.multiplier ? Math.round(actual * multiplier) : (manual.offer || actual)));
      
      // Ensure we don't have NaN
      actual = isNaN(actual) ? 0 : actual;
      offer = isNaN(offer) ? 0 : offer;

      const markupDisplay = (actual > 0 ? (offer / actual).toFixed(2) : '-');
      expensesActual += actual;
      expensesOffer += offer;
      results.push({ name, key, actual, markup: markupDisplay, offer, isExtracted, multiplier });
    };

    // モード別の抽出項目追加
    if (mode === 'SEA') {
      if (basicInfo.incoterms !== 'FOB') {
        const freightJpy = Math.round((extractedCosts.freightUsd || 0) * calcExchangeRate);
        addExpense('海上運賃 FREIGHT', 'freight', freightJpy, 1.2, true, true);
      }
      addExpense('CFS CHARGE / THC', 'cfsThc', extractedCosts.cfsThc || 0, 1.0, true, true);
      addExpense('輸出取扱料', 'handling', extractedCosts.exportHandlingFee || 0, 1.0, true, true);
      addExpense('DRC', 'drc', extractedCosts.drc || 0, 1.1, true, true);
      addExpense('B/L Document Fee', 'blFee', extractedCosts.blFee || 0, 1.1, true, true);
    } else if (mode === 'AIR') {
      if (basicInfo.incoterms !== 'FOB') {
        addExpense('FREIGHT (航空運賃)', 'freight', extractedCosts.freightJpy || 0, 1.2, true, true);
      }
      addExpense('取扱料 (輸出取扱料)', 'handling', extractedCosts.exportHandlingFee || 0, 1.0, true, true);
      addExpense('入出庫料', 'warehousing', extractedCosts.warehousingFee || 0, 1.1, true, true);
      addExpense('爆発物検査料', 'inspection', extractedCosts.explosiveInspectionFee || 0, 1.1, true, true);
      addExpense('航空保安取扱料', 'security', extractedCosts.securityHandlingFee || 0, 1.1, true, true);
      addExpense('AWB FEE', 'awbFee', extractedCosts.awbFee || 0, 1.1, true, true);
    } else if (mode === 'COURIER') {
      if (basicInfo.incoterms !== 'FOB') {
        addExpense('FREIGHT (宅配運賃)', 'freight', extractedCosts.freightJpy || 0, 1.2, true, true);
      }
      addExpense('FUEL CHARGE', 'fuel', extractedCosts.fuelCharge || 0, 1.2, true, true);
      addExpense('PEAK SEASON SURCHARGE', 'peakSeason', extractedCosts.peakSeasonSurcharge || 0, 1.2, true, true);
      addExpense('ドッキングチャージ', 'docking', extractedCosts.dockingCharge || 0, 1.1, true, true);
    }

    // 共通の手動・デフォルト項目
    addExpense('通関費', 'customsClearance', 5900, 2.0, true, true);
    addExpense('BANK CHARGE', 'bankCharge', 0, 0, false, false);
    addExpense('国内運賃', 'domestic', 0, 1.2, true, false);
    addExpense('輸出梱包費', 'packing', 0, 1.2, true, false);
    addExpense('その他', 'other', 0, 2.0, true, false);
    addExpense('保険', 'insurance', 0, 0, false, false);
    addExpense('BANK GUARANTEE', 'bankGuarantee', 0, 1.0, true, false);

    // 売値合計⑤ = FOB + 諸経費合計(OFFER)
    // If manual total override is provided, use it
    const totalExpensesOfferFinal = (manualOverrides.totalExpensesOfferOverride?.offer && manualCosts.totalExpensesOfferOverride) 
      ? manualCosts.totalExpensesOfferOverride.offer 
      : expensesOffer;
    const grandTotal = fobPrice + totalExpensesOfferFinal;
    
    // 客先提示単価⑦ = 売値⑤ ÷ 数量 -> 切り上げ丸め
    const unitPrice = basicInfo.quantity > 0 ? Math.ceil(grandTotal / basicInfo.quantity) : 0;

    // 利益計算
    const subtotal = grandTotal - totalCost; // 売値 - 仕入値
    const commissionAmount = Math.round(grandTotal * (basicInfo.commissionRate / 100));
    const estimatedProfit = subtotal - expensesActual - commissionAmount;
    const expectedProfitRate = grandTotal > 0 ? (estimatedProfit / grandTotal) * 100 : 0;

      return {
        m3,
        gw,
        nw,
        offerGW,
        offerNW,
        volumeWeight,
        chargeableWeight,
        offerChargeableWeight,
        totalCost,
        calcExchangeRate,
        fobPrice,
        totalExpensesActual: expensesActual,
        totalExpensesOffer: totalExpensesOfferFinal,
        rawExpensesOffer: expensesOffer,
        grandTotal,
        unitPrice,
        subtotal,
        commissionAmount,
        estimatedProfit,
        expectedProfitRate,
        results,
        missingItems
      };
  }, [basicInfo, extractedCosts, manualCosts, manualOverrides, mode, bankChargeOverride]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B1120] text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <Anchor className="w-6 h-6 text-blue-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">船積コスト見積</h1>
        </div>
        
        <div className="px-4 pb-4">
          <button 
            onClick={() => setCurrentView('create')} 
            className="flex items-center w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-3" /> 新規見積作成
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`flex items-center w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-[#1E3A8A] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" /> ダッシュボード
          </button>
          <button 
            onClick={() => setCurrentView('history')} 
            className={`flex items-center w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${currentView === 'history' ? 'bg-[#1E3A8A] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4 mr-3" /> 見積履歴
          </button>
          <button 
            className="flex items-center w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 mr-3" /> 設定
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              KT
            </div>
            <div>
              <p className="text-sm font-medium text-white">Kotaro Tanaka</p>
              <p className="text-xs text-slate-500">担当者</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'history' && <HistoryView />}
        
        {currentView === 'create' && (
          <div className="p-4 md:p-8 animate-in fade-in duration-300">
            <div className="max-w-[1600px] mx-auto space-y-8">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">見積作成支援AI</h1>
                  <p className="text-slate-500 mt-1">TTCフーズ株式会社 - 物流コスト自動計算システム</p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-slate-700">自動計算モード</span>
                </div>
              </div>

                    {/* Stepper */}
              <div className="py-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
                  {[
                    { id: 1, title: 'アップロード', icon: UploadCloud },
                    { id: 2, title: 'データ入力・補正', icon: FileText },
                    { id: 3, title: '船積諸経費＆見積（コスト計算書）', icon: Calculator },
                    { id: 4, title: '承認・出力', icon: CheckCircle },
                  ].map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center bg-slate-50 px-2">
                        <button 
                          onClick={() => setCurrentStep(step.id)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
                            isActive ? 'border-blue-600 text-blue-600 bg-white' : 
                            isCompleted ? 'border-blue-600 bg-blue-600 text-white' : 
                            'border-slate-300 text-slate-400 bg-white'
                          }`}
                        >
                          <step.icon className="w-5 h-5" />
                        </button>
                        <span className={`mt-3 text-sm font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[500px]">
                {currentStep === 1 && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-slate-800">書類のアップロード</h2>
                      <p className="text-slate-500">見積書やインボイスをアップロードして、AIにデータを抽出させます。</p>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-slate-700 flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-slate-500" />
                        輸送モード選択
                      </Label>
                      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-12">
                          <TabsTrigger value="SEA" className="flex items-center text-base"><Ship className="w-4 h-4 mr-2"/> SEA (船)</TabsTrigger>
                          <TabsTrigger value="AIR" className="flex items-center text-base"><Plane className="w-4 h-4 mr-2"/> AIR (航空)</TabsTrigger>
                          <TabsTrigger value="COURIER" className="flex items-center text-base"><Truck className="w-4 h-4 mr-2"/> COURIER</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-slate-700 flex items-center">
                        <UploadCloud className="w-5 h-5 mr-2 text-slate-500" />
                        ファイルアップロード
                      </Label>
                      <div 
                        className={`border-2 border-dashed rounded-xl p-10 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
                          isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 
                          hasUploaded ? 'border-emerald-500 bg-emerald-50' :
                          'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          onChange={handleFileInputChange}
                        />
                        {isProcessing ? (
                          <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <div>
                              <h3 className="text-lg font-medium text-slate-900">AIが書類を解析中...</h3>
                              <p className="text-sm text-slate-500 mt-1">見積書やインボイスからデータを抽出しています</p>
                            </div>
                          </div>
                        ) : hasUploaded ? (
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-emerald-900">読み取り完了</h3>
                              <p className="text-sm text-emerald-600 mt-1">AIによるデータ抽出が完了しました</p>
                            </div>
                            <Button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentStep(2); 
                              }} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              次へ進む
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                              <UploadCloud className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-900">ファイルをドロップするか、クリックして選択</h3>
                              <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG形式に対応しています</p>
                            </div>
                            {error && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{error}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">データ入力・補正</h2>
                        <p className="text-slate-500 mt-1">AIが抽出したデータを確認し、必要な情報を補足してください。</p>
                      </div>
                    </div>

                    {/* Top Section: Basic Info & Logistics (Full Width) */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 text-blue-700 font-semibold border-b border-blue-100 pb-2">
                        <FileText className="w-5 h-5" />
                        <h3>AI抽出データ & 基本情報</h3>
                      </div>

                      <div className="space-y-6 bg-blue-50/30 p-4 md:p-6 rounded-xl border border-blue-100">
                        {/* Row 1: 基本情報 & 物流・取引条件 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Category: 基本情報 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-800 border-b-2 border-blue-200 pb-1.5 flex items-center uppercase tracking-wider">
                              <Info className="w-4 h-4 mr-2" /> 基本情報
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  ESTIMATE / SC NO.
                                  {basicInfo.estimateNo && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Input name="estimateNo" value={basicInfo.estimateNo} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">DATE</Label>
                                <Input type="date" name="date" value={basicInfo.date} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  BUYER
                                  {basicInfo.buyer && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Input name="buyer" value={basicInfo.buyer} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  MAKER
                                  {basicInfo.maker && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Input name="maker" value={basicInfo.maker} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  PRODUCT (品名)
                                  {basicInfo.productName && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Input name="productName" value={basicInfo.productName} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">SPECIFICATION (仕様)</Label>
                                <Textarea name="specification" value={basicInfo.specification} onChange={handleBasicChange} className="min-h-[60px] bg-white text-xs" />
                              </div>
                            </div>
                          </div>

                          {/* Category: 物流・取引条件 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-800 border-b-2 border-blue-200 pb-1.5 flex items-center uppercase tracking-wider">
                              <Ship className="w-4 h-4 mr-2" /> 物流・取引条件
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  DESTINATION
                                  {basicInfo.destination && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Input name="destination" value={basicInfo.destination} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  INCOTERMS
                                  {basicInfo.incoterms && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Select value={basicInfo.incoterms} onValueChange={(v) => setBasicInfo({...basicInfo, incoterms: v})}>
                                  <SelectTrigger className="h-8 bg-white text-xs">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CIP">CIP</SelectItem>
                                    <SelectItem value="CPT">CPT</SelectItem>
                                    <SelectItem value="CFR">CFR</SelectItem>
                                    <SelectItem value="FOB">FOB</SelectItem>
                                    <SelectItem value="DAP">DAP</SelectItem>
                                    <SelectItem value="EXG">EXG</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">LOADING PORT</Label>
                                <Input name="loadingPort" value={basicInfo.loadingPort} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">ETD</Label>
                                <Input name="etd" value={basicInfo.etd} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] flex items-center text-slate-600 font-bold">
                                  PAYMENT TERMS
                                  {basicInfo.paymentTerms && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded ml-1.5 border border-blue-100">AI</span>}
                                </Label>
                                <Select value={basicInfo.paymentTerms} onValueChange={(v) => setBasicInfo({...basicInfo, paymentTerms: v})}>
                                  <SelectTrigger className="h-8 bg-white text-xs">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="L/C">L/C</SelectItem>
                                    <SelectItem value="D/A">D/A</SelectItem>
                                    <SelectItem value="T/T">T/T</SelectItem>
                                    <SelectItem value="OTHER">その他</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">PAYMENT DAYS</Label>
                                <Input name="paymentDays" value={basicInfo.paymentDays} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">DELIVERY DATE</Label>
                                <Input name="deliveryDate" value={basicInfo.deliveryDate} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: 梱包・重量 & 価格・レート */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-blue-100">
                          {/* Category: 梱包・重量 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-800 border-b-2 border-blue-200 pb-1.5 flex items-center uppercase tracking-wider">
                              <Truck className="w-4 h-4 mr-2" /> 梱包・重量
                            </h4>
                            
                            {/* Package List Editor */}
                            <div className="space-y-3 mb-4 bg-white/50 p-4 rounded-lg border border-blue-100">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-[11px] text-slate-600 font-bold uppercase tracking-tight">Package Details (L x W x H, Weight, Qty)</Label>
                                <Button variant="ghost" size="sm" onClick={addPackage} className="h-6 text-[10px] text-blue-600 hover:text-blue-700 p-0 font-bold">
                                  <Plus className="w-3.5 h-3.5 mr-1.5" /> ADD ITEM
                                </Button>
                              </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {basicInfo.packages.map((pkg, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-1.5 flex-1">
                                      <Input type="number" placeholder="L" value={pkg.length || ''} onChange={(e) => handlePackageChange(idx, 'length', e.target.value)} className="h-7 w-12 text-[11px] px-1.5 text-center" title="Length (cm)" />
                                      <span className="text-slate-400 text-[10px]">×</span>
                                      <Input type="number" placeholder="W" value={pkg.width || ''} onChange={(e) => handlePackageChange(idx, 'width', e.target.value)} className="h-7 w-12 text-[11px] px-1.5 text-center" title="Width (cm)" />
                                      <span className="text-slate-400 text-[10px]">×</span>
                                      <Input type="number" placeholder="H" value={pkg.height || ''} onChange={(e) => handlePackageChange(idx, 'height', e.target.value)} className="h-7 w-12 text-[11px] px-1.5 text-center" title="Height (cm)" />
                                    </div>
                                    <div className="flex items-center space-x-1.5 border-l border-slate-100 pl-2">
                                      <span className="text-slate-400 text-[10px] font-bold">W:</span>
                                      <Input type="number" placeholder="kg" value={pkg.weight || ''} onChange={(e) => handlePackageChange(idx, 'weight', e.target.value)} className="h-7 w-14 text-[11px] px-1.5 text-right" title="Weight (kg)" />
                                      <span className="text-slate-400 text-[10px] font-bold ml-1.5">Q:</span>
                                      <Input type="number" placeholder="1" value={pkg.quantity || ''} onChange={(e) => handlePackageChange(idx, 'quantity', e.target.value)} className="h-7 w-10 text-[11px] px-1.5 text-center" title="Quantity" />
                                    </div>
                                    {basicInfo.packages.length > 1 && (
                                      <Button variant="ghost" size="sm" onClick={() => removePackage(idx)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 flex justify-between items-center text-[11px] font-bold text-slate-500 border-t border-blue-100 mt-2">
                                <span>TOTAL M3: <span className="text-blue-700">{calculation.m3.toFixed(3)}</span></span>
                                <span>TOTAL GW: <span className="text-blue-700">{calculation.gw.toLocaleString()} kg</span></span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">実際の重量 (NW) kg</Label>
                                <Input type="number" name="actualNW" value={basicInfo.actualNW || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">実際の重量 (GW) kg</Label>
                                <Input type="number" name="actualGW" value={basicInfo.actualGW || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">OFFER用仮重量 (NW) kg</Label>
                                <Input type="number" name="offerNW" value={basicInfo.offerNW || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">OFFER用仮重量 (GW) kg</Label>
                                <Input type="number" name="offerGW" value={basicInfo.offerGW || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">VOLUME WEIGHT</Label>
                                <Input type="number" name="volumeWeight" value={basicInfo.volumeWeight || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">GW (CALC)</Label>
                                <Input type="number" name="calcGW" value={basicInfo.calcGW || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                            </div>
                          </div>

                          {/* Category: 価格・レート */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-800 border-b-2 border-blue-200 pb-1.5 flex items-center uppercase tracking-wider">
                              <Calculator className="w-4 h-4 mr-2" /> 価格・レート
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">仕入値単価 (JPY)</Label>
                                <Input type="number" name="unitPrice" value={basicInfo.unitPrice || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">数量</Label>
                                <Input type="number" name="quantity" value={basicInfo.quantity || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">希望利益率 (%)</Label>
                                <Input type="number" name="profitMargin" value={basicInfo.profitMargin || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">コミッション (%)</Label>
                                <Input type="number" name="commissionRate" value={basicInfo.commissionRate || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">為替レート (TTS)</Label>
                                <Input type="number" name="exchangeRate" value={basicInfo.exchangeRate || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-600 font-bold">A/S RATE (OFFER)</Label>
                                <Input type="number" name="asRate" value={basicInfo.asRate || ''} onChange={handleBasicChange} className="h-8 bg-white text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Cost Input & Real-time Preview */}
                    <div className="space-y-12">
                      {/* Unified Cost Input Table */}
                      <div className="space-y-6">
                        <div className="flex items-center space-x-2 text-blue-700 font-semibold border-b border-blue-100 pb-2">
                          <Calculator className="w-5 h-5" />
                          <h3>船積諸経費＆見積（コスト計算書） - データ入力・補正</h3>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-1/4">項目</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700 w-1/4">ACTUAL (実費)</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700 w-1/6">倍率</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700 w-1/4">OFFER (タリフベース)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {calculation.results.map((res: any) => (
                                <tr key={res.key} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-700 font-medium flex items-center">
                                    {res.name}
                                    {res.isExtracted && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded ml-2">AI抽出</span>}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input 
                                      type="number" 
                                      value={res.actual} 
                                      onChange={(e) => handleManualCostChange(res.key, 'actual', e.target.value)}
                                      className="h-8 text-right bg-transparent border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input 
                                      type="number" 
                                      step="0.1"
                                      value={res.multiplier} 
                                      onChange={(e) => handleManualCostChange(res.key, 'multiplier', e.target.value)}
                                      className="h-8 text-center bg-transparent border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input 
                                      type="number" 
                                      value={res.offer} 
                                      onChange={(e) => handleManualCostChange(res.key, 'offer', e.target.value)}
                                      className="h-8 text-right bg-transparent border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {/* Items that might not be in results yet but are in manualCosts */}
                              {/* Removed redundant loop as addExpense covers all items */}
                              <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                                <td className="px-4 py-4 text-slate-900 text-base">諸経費合計</td>
                                <td className="px-4 py-4 text-right text-slate-900 text-base">
                                  {calculation.totalExpensesActual.toLocaleString()} JPY
                                </td>
                                <td className="px-4 py-4 text-center text-slate-400 text-sm">---</td>
                                <td className="px-4 py-4 text-right text-blue-700 text-base font-bold">
                                  ¥ {calculation.totalExpensesOffer.toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Real-time Calculation Preview (Below the table) */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                          <div className="flex items-center space-x-2 text-slate-700 font-semibold border-b border-slate-200 pb-2">
                            <TrendingUp className="w-5 h-5" />
                            <h3>船積諸経費＆見積（コスト計算書）サマリー</h3>
                          </div>

                          <Card className="border-blue-200 shadow-md overflow-hidden">
                            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                              <div>
                                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider font-bold">見積合計金額 (OFFER)</div>
                                <div className="text-3xl font-bold">¥ {calculation.grandTotal.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider font-bold">単価</div>
                                <div className="text-xl font-bold">¥ {(calculation.grandTotal / (basicInfo.quantity || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                              </div>
                            </div>
                            <div className="p-6 bg-white">
                              <div className="grid grid-cols-3 gap-8">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">小計 (利益)</span>
                                  <div className="text-xl font-semibold text-slate-800">¥ {calculation.subtotal.toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">コミッション</span>
                                  <div className="text-xl font-semibold text-slate-800">¥ {calculation.commissionAmount.toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">見込み純利益</span>
                                  <div className={`text-xl font-bold ${calculation.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ¥ {calculation.estimatedProfit.toLocaleString()}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">見込み利益率</span>
                                  <div className={`text-xl font-bold ${calculation.expectedProfitRate >= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {calculation.expectedProfitRate.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                              <FileText className="w-5 h-5" />
                              <h3>配送サマリー</h3>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                            <div className="grid grid-cols-1 gap-y-3 text-sm">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <Label className="text-slate-500 text-xs font-bold">輸送モード:</Label>
                                <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                                  <SelectTrigger className="h-7 w-32 bg-white text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SEA">SEA</SelectItem>
                                    <SelectItem value="AIR">AIR</SelectItem>
                                    <SelectItem value="COURIER">COURIER</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-slate-500 text-[10px]">実重量 NW (kg)</Label>
                                    <Input type="number" name="actualNW" value={basicInfo.actualNW || ''} onChange={handleBasicChange} className="h-7 bg-slate-50 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-slate-500 text-[10px]">実重量 GW (kg)</Label>
                                    <Input type="number" name="actualGW" value={basicInfo.actualGW || ''} onChange={handleBasicChange} className="h-7 bg-slate-50 text-xs" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-slate-500 text-[10px]">見積用 NW (kg)</Label>
                                    <Input type="number" name="offerNW" value={basicInfo.offerNW || ''} onChange={handleBasicChange} className="h-7 bg-slate-50 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-slate-500 text-[10px]">見積用 GW (kg)</Label>
                                    <Input type="number" name="offerGW" value={basicInfo.offerGW || ''} onChange={handleBasicChange} className="h-7 bg-slate-50 text-xs" />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                                <div className="space-y-1">
                                  <Label className="text-slate-500 text-[10px]">容積重量</Label>
                                  <div className="h-7 flex items-center px-3 bg-slate-100 rounded text-xs font-medium">{calculation.volumeWeight.toFixed(2)} kg</div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-slate-500 text-[10px]">運賃適用重量 (OFFER)</Label>
                                  <div className="h-7 flex items-center px-3 bg-blue-50 rounded text-xs font-bold text-blue-700">{calculation.offerChargeableWeight.toFixed(2)} kg</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <Label className="text-slate-500 text-xs font-bold">諸経費合計 (OFFER):</Label>
                                <span className="font-bold text-blue-700">¥ {(calculation.totalExpensesOffer || 0).toLocaleString()}</span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-slate-500 text-xs">船積時期:</Label>
                                  <Input name="shipmentTime" value={basicInfo.shipmentTime} onChange={handleBasicChange} className="h-7 w-48 bg-white text-xs" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-slate-500 text-xs">梱包:</Label>
                                  <Input name="packing" value={basicInfo.packing} onChange={handleBasicChange} className="h-7 w-48 bg-white text-xs" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-slate-500 text-xs">有効期限:</Label>
                                  <Input name="validity" value={basicInfo.validity} onChange={handleBasicChange} className="h-7 w-48 bg-white text-xs" />
                                </div>
                              </div>
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <Label className="text-slate-500 text-xs">利益率 (%):</Label>
                                <Input type="number" name="profitMargin" value={basicInfo.profitMargin || ''} onChange={handleBasicChange} className="h-7 w-24 bg-white text-xs text-right" />
                              </div>
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <Label className="text-slate-500 text-xs">コミッション率 (%):</Label>
                                <Input type="number" name="commissionRate" value={basicInfo.commissionRate || ''} onChange={handleBasicChange} className="h-7 w-24 bg-white text-xs text-right" />
                              </div>
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <Label className="text-slate-500 text-xs">為替レート (TTS):</Label>
                                <Input type="number" name="exchangeRate" value={basicInfo.exchangeRate || ''} onChange={handleBasicChange} className="h-7 w-24 bg-white text-xs text-right" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-slate-500 text-xs">実費見積レート (A/S):</Label>
                                <Input type="number" name="asRate" value={basicInfo.asRate || ''} onChange={handleBasicChange} className="h-7 w-24 bg-white text-xs text-right" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                      <div className="flex justify-between pt-6 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> 戻る
                        </Button>
                        <Button onClick={() => setCurrentStep(3)} className="w-80 bg-blue-600 hover:bg-blue-700">
                          船積諸経費＆見積（コスト計算書）を確認 <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                  </div>
                )}

                {currentStep === 3 && calculation && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">船積諸経費 ＆ 見積（コスト計算書）</h2>
                        <p className="text-slate-500 mt-1">PDF出力用のフォーマットで計算結果を確認します。</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleExportPDF('calculation-preview-pdf', `船積諸経費_見積コスト計算書_${basicInfo.estimateNo || 'EST-2024-047'}.pdf`)}
                      >
                        <FileText className="w-4 h-4 mr-2" /> PDFダウンロード
                      </Button>
                    </div>

                    {calculation.missingItems.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-red-800">未確定事項 (入力が必要です)</h4>
                          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                            {calculation.missingItems.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <InternalCalculationSheet basicInfo={basicInfo} calculation={calculation} />

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> 戻る
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(4)} 
                        disabled={calculation.missingItems.length > 0}
                        className="w-32"
                      >
                        確認・出力 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">承認・出力</h2>
                        <p className="text-slate-500 mt-1">見積書の内容を確認し、承認申請またはPDF出力を行います。</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <Button 
                          variant={viewMode === 'internal' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setViewMode('internal')}
                          className="text-xs h-8"
                        >
                          船積諸経費 ＆ 見積（コスト計算書）
                        </Button>
                        <Button 
                          variant={viewMode === 'official' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setViewMode('official')}
                          className="text-xs h-8"
                        >
                          公式見積書
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center overflow-auto py-4 bg-slate-200/50 rounded-xl min-h-[600px]">
                      {viewMode === 'internal' ? (
                        <InternalCalculationSheet basicInfo={basicInfo} calculation={calculation} />
                      ) : (
                        <OfficialEstimateSheet basicInfo={basicInfo} calculation={calculation} />
                      )}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <Button variant="outline" onClick={() => setCurrentStep(3)}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> 戻る
                      </Button>
                      <div className="flex space-x-3">
                        <Button 
                          variant="outline" 
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            const elementId = viewMode === 'internal' ? 'calculation-preview-pdf' : 'official-estimate-pdf';
                            const filename = viewMode === 'internal' 
                              ? `船積諸経費_見積コスト計算書_${basicInfo.estimateNo || 'EST-2024-000'}.pdf` 
                              : `ESTIMATE_${basicInfo.estimateNo || 'EST-2024-000'}.pdf`;
                            handleExportPDF(elementId, filename);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" /> PDFダウンロード
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="w-4 h-4 mr-2" /> 承認申請する
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
