import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Architecture Prototype",
  description: "Generate building layouts and check zoning compliance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Suppress browser extension errors (e.g. updateActuationOverlay from shadow host) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Override extension-injected function to prevent console errors
                var origDefine = Object.defineProperty;
                Object.defineProperty(window, 'updateActuationOverlay', {
                  configurable: true,
                  set: function(fn) {
                    origDefine(window, 'updateActuationOverlay', {
                      configurable: true,
                      writable: true,
                      value: function() {
                        try { return fn.apply(this, arguments); } catch(e) {}
                      }
                    });
                  },
                  get: function() { return undefined; }
                });
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
