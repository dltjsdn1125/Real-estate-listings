'use client'

interface PropertySummaryProps {
  floor?: string
  contractArea?: string
  exclusiveArea?: string
  maintenance?: string
  parking?: string
  elevator?: string
  restroom?: string
  moveIn?: string
}

export default function PropertySummary({
  floor,
  contractArea,
  exclusiveArea,
  maintenance,
  parking,
  elevator,
  restroom,
  moveIn,
}: PropertySummaryProps) {
  const items = [
    { label: 'Floor', value: floor },
    { label: 'Contract Area', value: contractArea },
    { label: 'Exclusive Area', value: exclusiveArea },
    { label: 'Maintenance', value: maintenance },
    { label: 'Parking', value: parking },
    { label: 'Elevator', value: elevator },
    { label: 'Restroom', value: restroom },
    { label: 'Move-in', value: moveIn },
  ].filter((item) => item.value)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#f0f2f4] dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-bold mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">info</span>
        Property Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-1">
            <span className="text-xs text-[#616f89] font-medium uppercase tracking-wider">
              {item.label}
            </span>
            <span className="text-sm md:text-base font-semibold text-[#111318] dark:text-white">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

