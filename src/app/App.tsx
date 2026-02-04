import { LocationCarousel } from "./components/LocationCarousel";
import { PollingSection } from "./components/PollingSection";
import posterImage from "figma:asset/b4ce4d3955b156f008b32e362441c87e3409001d.png";

export default function App() {
  const locations = [
    {
      name: "Bebek Kaleo Jababeka",
      mapsLink: "https://share.google/688fgUXQiaIoMj0ts",
      images: [
        "https://images.unsplash.com/photo-1567600175325-3573c56bee05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBjb3p5fGVufDF8fHx8MTc3MDIyMTQzOHww&ixlib=rb-4.1.0&q=80&w=1080",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      ],
    },
    {
      name: "Tana Bambu Cibubur",
      mapsLink: "https://share.google/oBqxaPIbwRrTpa3pj",
      images: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
      ],
    },
    {
      name: "Sudut Kedai Metland Cileungsi",
      mapsLink: "https://share.google/oGVqpGJg9x6KyS9mC",
      images: [
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
      ],
    },
    {
      name: "Ayam Taliwang Kotwis",
      mapsLink: "https://share.google/pJyCXsXlHOzy8havB",
      images: [
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
        "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&q=80",
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
      ],
    },
  ];

  const locationOptions = [
    "Bebek Kaleo Jababeka",
    "Tana Bambu Cibubur",
    "Sudut Kedai Metland",
    "Ayam Taliwang Kotwis",
  ];

  const dateOptions = ["7 Maret 2026", "8 Maret 2026", "14 Maret 2026"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-[#00417e] opacity-10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -right-40 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-[#00417e] opacity-10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section with Glass Effect */}
        <section className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00417e] via-[#0052a3] to-[#00417e]"></div>
          
          {/* Glass Overlay Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
          </div>

          <div className="relative container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-4xl mx-auto text-center text-white">
              <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <p className="text-sm md:text-base font-medium uppercase tracking-widest">
                  Nara Class Event
                </p>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                Buka Bareng Nara
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Mari berkumpul dalam kehangatan kebersamaan di bulan penuh berkah
              </p>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white" fillOpacity="0.1"/>
              <path d="M0 40L60 46.7C120 53 240 67 360 70C480 73 600 67 720 63.3C840 60 960 60 1080 63.3C1200 67 1320 73 1380 76.7L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V40Z" fill="white" fillOpacity="0.05"/>
              <path d="M0 80L60 76.7C120 73 240 67 360 66.7C480 67 600 73 720 76.7C840 80 960 80 1080 76.7C1200 73 1320 67 1380 63.3L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V80Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* Poster Section with Glass Card */}
        <section className="container mx-auto px-4 -mt-12 md:-mt-16 mb-16 md:mb-24">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-3 md:p-4">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={posterImage}
                  alt="Buka Bareng Nara Event Poster"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Invitation Section with Glass Effect */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="inline-block w-16 h-1 bg-gradient-to-r from-transparent via-[#00417e] to-transparent mb-6"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#00417e] mb-4">
                  Di Bulan Penuh Berkah
                </h2>
                <div className="inline-block w-16 h-1 bg-gradient-to-r from-transparent via-[#00417e] to-transparent mt-4"></div>
              </div>
              
              <div className="space-y-6 text-base md:text-lg leading-relaxed text-gray-700">
                <p className="text-center italic text-gray-600">
                  Di bulan yang mengajarkan kita untuk melambat,<br/>
                  ada satu waktu yang ingin kita sempatkan bersama.
                </p>
                
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>
                
                <p>
                  Buka bersama bukan sekadar makan di waktu yang sama, tapi tentang duduk berdampingan, 
                  menyapa yang lama tak jumpa, dan mensyukuri kebersamaan yang masih ada.
                </p>
                
                <p>
                  Kita berkumpul menjelang adzan, mengisi waktu dengan cerita sederhana, 
                  lalu berbagi hidangan dan doa saat hari mulai beranjak malam.
                </p>
                
                <p>
                  Tanpa agenda besar, tanpa tuntutan apa-apa. 
                  Hanya niat baik dan kehadiran.
                </p>
                
                <p>
                  Karena di Ramadhan ini, kebersamaan adalah salah satu bentuk syukur.
                </p>
                
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>
                
                <div className="text-center pt-4">
                  <div className="inline-block glass-card-sm px-8 py-6">
                    <p className="text-2xl md:text-3xl font-bold text-[#00417e] mb-2">Buka Bareng Nara</p>
                    <p className="text-lg font-medium text-gray-600">Mari hadir, dan saling menguatkan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#00417e] mb-4">
                Pilihan Lokasi
              </h2>
              <p className="text-gray-600">Empat tempat istimewa untuk kebersamaan kita</p>
            </div>
            
            <div className="space-y-8">
              {locations.map((location, index) => (
                <LocationCarousel
                  key={index}
                  name={location.name}
                  images={location.images}
                  mapsLink={location.mapsLink}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Polling Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#00417e] mb-4">
                Tentukan Pilihan
              </h2>
              <p className="text-gray-600">Suara Anda sangat berarti untuk kita semua</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <PollingSection
                title="Tempat Favorit"
                options={locationOptions}
                pollType="location"
              />
              
              <PollingSection
                title="Waktu yang Cocok"
                options={dateOptions}
                pollType="date"
              />
            </div>
          </div>
        </section>

        {/* Footer with Glass Effect */}
        <footer className="relative mt-20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00417e] via-[#0052a3] to-[#00417e]"></div>
          <div className="relative container mx-auto px-4 py-12 text-center text-white">
            <div className="glass-card-sm inline-block px-8 py-6">
              <p className="text-xl font-semibold mb-2">
                Nara Class Event 2026
              </p>
              <p className="text-blue-200">
                Dibuat dengan ❤️ untuk kebersamaan
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
