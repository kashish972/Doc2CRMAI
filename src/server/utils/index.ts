export {
  detectFileType,
  extractTextFromFile,
  extractTextFromBuffer,
  type FileType,
} from "./extraction";

export { parseDocumentWithAI } from "./ai-parser";
export { generateGoogleFormPrefill, normalizeGoogleFormUrl } from "./google-form";
export { buildGoogleFormTemplate } from "./google-form-template";
export { buildGoogleOAuthStartUrl, createRealGoogleFormFromDocument, decodeGoogleOAuthState } from "./google-forms-real";
