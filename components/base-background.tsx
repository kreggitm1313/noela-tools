'use client'

export function BaseBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large blue circle - top right */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #0052FF 0%, transparent 70%)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      
      {/* Medium blue blob - top left */}
      <div 
        className="absolute top-20 -left-20 w-64 h-64 rounded-full opacity-8"
        style={{
          background: 'radial-gradient(ellipse, #0052FF 0%, transparent 60%)',
          animation: 'float 15s ease-in-out infinite reverse',
        }}
      />
      
      {/* Small white circle - middle right */}
      <div 
        className="absolute top-1/3 right-10 w-32 h-32 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)',
          animation: 'float 12s ease-in-out infinite',
        }}
      />
      
      {/* Large blue gradient blob - bottom left */}
      <div 
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-6"
        style={{
          background: 'radial-gradient(circle, #0052FF 0%, #0041CC 40%, transparent 70%)',
          animation: 'float 25s ease-in-out infinite',
        }}
      />
      
      {/* Medium white blob - bottom right */}
      <div 
        className="absolute bottom-20 right-20 w-48 h-48 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #FFFFFF 0%, transparent 60%)',
          animation: 'float 18s ease-in-out infinite reverse',
        }}
      />
      
      {/* Small blue square - middle left */}
      <div 
        className="absolute top-1/2 left-10 w-24 h-24 rounded-3xl opacity-8"
        style={{
          background: 'linear-gradient(135deg, #0052FF 0%, #0041CC 100%)',
          animation: 'float 14s ease-in-out infinite, rotate 30s linear infinite',
        }}
      />
      
      {/* Tiny blue dots scattered */}
      <div 
        className="absolute top-1/4 right-1/4 w-4 h-4 rounded-full bg-[#0052FF] opacity-20"
        style={{ animation: 'float 10s ease-in-out infinite' }}
      />
      <div 
        className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full bg-white opacity-30"
        style={{ animation: 'float 13s ease-in-out infinite reverse' }}
      />
      <div 
        className="absolute top-1/2 right-1/3 w-5 h-5 rounded-full bg-[#0052FF] opacity-15"
        style={{ animation: 'float 16s ease-in-out infinite' }}
      />
    </div>
  )
}
