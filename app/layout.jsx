export const metadata = {
  title: "Le Sicilien",
  description: "Luxury Real Estate · Palermo, Sicilia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
