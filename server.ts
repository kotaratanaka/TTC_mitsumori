import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for file uploads
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/extract-data", async (req, res) => {
    try {
      const { mimeType, data } = req.body;

      if (!mimeType || !data) {
        return res.status(400).json({ error: "Missing mimeType or data" });
      }

      const isValidKey = (key: any) => typeof key === 'string' && key.length > 10 && key !== "undefined" && key !== "null";
      
      let apiKey = process.env.GEMINI_API_KEY;
      if (!isValidKey(apiKey)) {
        apiKey = process.env.API_KEY;
      }

      if (!isValidKey(apiKey)) {
        return res.status(401).json({ 
          error: "APIキーが設定されていません。右上の設定メニューからAPIキーを選択してください。",
          code: "API_KEY_MISSING"
        });
      }
      
      console.log("Using API Key (first 4 chars):", apiKey?.substring(0, 4));

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: "提供されたドキュメント（フォワーダー見積書など）から、以下の物流コスト情報や荷物情報を抽出し、JSON形式で返してください。見つからない項目は0または空文字にしてください。数値はカンマを除いた数値型としてください。入出庫料は数量×単価の計算結果（例：4275）を抽出してください。サイズ・重量は複数ある場合を想定し配列で返してください。輸出取扱量は固定値ではなく、インプットとなる見積書の中にも記載があるのでその値を引っ張ってきてください。抽出の優先順位は、SEA/AIRの場合は2ページ目、COURIERの場合は1ページ目の内容を優先してください。特にESTIMATE / SALES CONTRACT NO., BUYER, MAKER, PRODUCTの順で並んでいる情報を正確に抽出してください。",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              freightUsd: { type: Type.NUMBER, description: "SEA: 海上運賃 FREIGHT (US$建て金額)" },
              freightJpy: { type: Type.NUMBER, description: "AIR/COURIER: 運賃 FREIGHT (円建て金額)" },
              cfsThc: { type: Type.NUMBER, description: "SEA: CFS CHARGE または THC" },
              exportHandlingFee: { type: Type.NUMBER, description: "SEA/AIR: 輸出取扱料 または 取扱料" },
              exportHandlingVolume: { type: Type.NUMBER, description: "輸出取扱量 または 数量 (輸出取扱料の計算に使われる値)" },
              drc: { type: Type.NUMBER, description: "SEA: DRC" },
              blFee: { type: Type.NUMBER, description: "SEA: B/L Document Fee または B/L FEE" },
              warehousingFee: { type: Type.NUMBER, description: "AIR: 入出庫料（計算結果の合計金額）" },
              explosiveInspectionFee: { type: Type.NUMBER, description: "AIR: 爆発物検査料" },
              securityHandlingFee: { type: Type.NUMBER, description: "AIR: 航空保安取扱料" },
              awbFee: { type: Type.NUMBER, description: "AIR: AWB FEE" },
              fuelCharge: { type: Type.NUMBER, description: "COURIER: FUEL CHARGE または 燃油サーチャージ" },
              peakSeasonSurcharge: { type: Type.NUMBER, description: "COURIER: PEAK SEASON SURCHARGE" },
              dockingCharge: { type: Type.NUMBER, description: "COURIER: ドッキングチャージ" },
              customsClearance: { type: Type.NUMBER, description: "通関費 または 通関料" },
              destination: { type: Type.STRING, description: "仕向地 または 向け地" },
              productName: { type: Type.STRING, description: "品名 または PRODUCT" },
              estimateNo: { type: Type.STRING, description: "ESTIMATE / SALES CONTRACT NO. または 見積書番号" },
              buyer: { type: Type.STRING, description: "BUYER または 宛先" },
              maker: { type: Type.STRING, description: "MAKER または メーカー" },
              incoterms: { type: Type.STRING, description: "建値条件 (CIP/CPT/CFR/FOB/DAP/EXG)" },
              paymentTerms: { type: Type.STRING, description: "販売条件 (L/C, D/A, T/T)" },
              loadingPort: { type: Type.STRING, description: "積地 または 積出港" },
              deliveryDate: { type: Type.STRING, description: "納入日 または 納期" },
              etd: { type: Type.STRING, description: "ETD または 出港予定日" },
              quantity: { type: Type.NUMBER, description: "商品の総数量" },
              packages: {
                type: Type.ARRAY,
                description: "荷姿・サイズ・重量のリスト",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    length: { type: Type.NUMBER, description: "長さ(cm)" },
                    width: { type: Type.NUMBER, description: "幅(cm)" },
                    height: { type: Type.NUMBER, description: "高さ(cm)" },
                    weight: { type: Type.NUMBER, description: "重量(kg)" },
                    quantity: { type: Type.NUMBER, description: "個数" },
                  }
                }
              }
            },
          },
        },
      });

      let extractedData = {};
      try {
        const text = response.text || "{}";
        // Clean up markdown code blocks if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedText = jsonMatch ? jsonMatch[0] : text;
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse JSON from Gemini response:", response.text);
        throw new Error("Failed to parse extracted data as JSON");
      }
      res.json(extractedData);
    } catch (error: any) {
      console.error("Error extracting data:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isApiKeyError = errorMessage.includes("API key not valid") || 
                           errorMessage.includes("API_KEY_INVALID") ||
                           errorMessage.includes("401");
      
      res.status(isApiKeyError ? 401 : 500).json({ 
        error: isApiKeyError ? "Invalid API Key" : "Failed to extract data", 
        details: errorMessage,
        code: isApiKeyError ? "API_KEY_INVALID" : "EXTRACTION_ERROR"
      });
    }
  });

  // Catch-all for API routes to prevent falling through to SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
