import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#1A202C] py-8">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-[#616f89]">
          © 2024 Daegu Commercial Platform. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-[#616f89]">
          <Link href="/" className="hover:text-primary transition-colors">
            홈
          </Link>
          <Link href="/map" className="hover:text-primary transition-colors">
            매물 탐색
          </Link>
          <Link href="/auth/login" className="hover:text-primary transition-colors">
            로그인
          </Link>
          <Link href="/auth/signup" className="hover:text-primary transition-colors">
            회원가입
          </Link>
          <Link href="/admin/properties/new" className="hover:text-primary transition-colors">
            매물 등록
          </Link>
          <Link href="/admin/users" className="hover:text-primary transition-colors">
            관리자
          </Link>
        </div>
      </div>
    </footer>
  )
}

