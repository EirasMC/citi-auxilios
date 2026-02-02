
/// <reference types="vite/client" />

declare module 'react' {
  export = React;
  export as namespace React;
  const React: any;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'lucide-react' {
  export const LogOut: any;
  export const User: any;
  export const Database: any;
  export const HardDrive: any;
  export const Loader2: any;
  export const Lock: any;
  export const Mail: any;
  export const ArrowRight: any;
  export const UserPlus: any;
  export const HelpCircle: any;
  export const CheckCircle: any;
  export const FileText: any;
  export const Upload: any;
  export const History: any;
  export const AlertCircle: any;
  export const Plus: any;
  export const ChevronRight: any;
  export const Download: any;
  export const Link: any;
  export const Image: any;
  export const Award: any;
  export const DollarSign: any;
  export const Trash2: any;
  export const XCircle: any;
  export const Eye: any;
  export const AlertTriangle: any;
  export const MapPin: any;
  export const Info: any;
  export const Calendar: any;
  export const ShieldCheck: any;
}

declare module '@supabase/supabase-js' {
  export const createClient: any;
}

declare module '@emailjs/browser' {
  const emailjs: {
    send: (serviceId: string, templateId: string, templateParams: any, publicKey: string) => Promise<any>;
  };
  export default emailjs;
}
