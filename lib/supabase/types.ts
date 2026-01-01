export type UserTier = 'bronze' | 'silver' | 'gold' | 'premium' | 'agent' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type PropertyType = 'store' | 'office' | 'building'
export type TransactionType = 'rent_monthly' | 'rent_yearly' | 'sale'
export type PropertyStatus = 'available' | 'sold' | 'pending' | 'hidden'

export interface User {
  id: string
  email: string
  role: string
  full_name: string | null
  phone: string | null
  profile_image_url: string | null
  tier: UserTier
  company_name: string | null
  license_number: string | null
  approval_status: ApprovalStatus
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  title: string
  description: string | null
  property_type: PropertyType
  transaction_type: TransactionType
  district: string
  dong: string | null
  address: string
  detail_address: string | null
  hide_detail_address: boolean
  latitude: number | null
  longitude: number | null
  deposit: number | null
  monthly_rent: number | null
  yearly_rent: number | null
  sale_price: number | null
  key_money: number | null
  maintenance_fee: number | null
  vat_excluded: boolean
  exclusive_area: number | null
  contract_area: number | null
  floor_current: number | null
  floor_total: number | null
  approval_date: string | null
  has_elevator: boolean
  has_parking: boolean
  immediate_move_in: boolean
  is_public: boolean
  is_premium: boolean
  admin_notes: string | null
  created_by: string
  agent_id: string | null
  status: PropertyStatus
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  image_alt: string | null
  is_main: boolean
  display_order: number
  created_at: string
}

export interface PropertyTag {
  id: string
  property_id: string
  tag: string
  created_at: string
}

export interface PartnerInfo {
  id: string
  user_id: string
  company_name: string
  business_license: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

