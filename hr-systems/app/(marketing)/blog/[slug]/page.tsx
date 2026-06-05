import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";

const BLUE = "#3B5BDB";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[740px] mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-8 text-[13px] text-gray-400">
          <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-700">{params.slug}</span>
        </div>
        <div className="inline-block mb-5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#EEF2FF", color: BLUE }}>
          Năng suất
        </div>
        <h1 className="text-[30px] lg:text-[38px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-5">
          5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết
        </h1>
        <div className="flex items-center gap-5 mb-10 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: BLUE }}>MT</div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Minh Tuấn</p>
              <p className="text-[11px] text-gray-400">Co-founder, jobihome</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-gray-400">
            <span className="flex items-center gap-1.5"><Calendar size={12} /> 2 tháng 6, 2025</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> 8 phút đọc</span>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-[15px] leading-[1.85]">
          <p>
            Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.
          </p>
          <h2 className="text-[22px] font-bold text-gray-900 mt-10 mb-4">1. Họp để "báo cáo tiến độ" thay vì quyết định</h2>
          <p>
            Nếu nội dung chính của cuộc họp là "anh A làm xong task X rồi, chị B đang làm Y"... thì đây là dấu hiệu rõ nhất. Status update có thể được chia sẻ qua tool — không cần block calendar của cả team.
          </p>
          <h2 className="text-[22px] font-bold text-gray-900 mt-10 mb-4">2. Mời quá nhiều người không cần thiết</h2>
          <p>
            Quy tắc: mỗi người trong phòng phải có một quyết định cần đưa ra hoặc thông tin quan trọng cần chia sẻ. Nếu không, họ không cần có mặt.
          </p>
          <h2 className="text-[22px] font-bold text-gray-900 mt-10 mb-4">3. Không có agenda trước buổi họp</h2>
          <p>
            Họp không có agenda = đi lang thang không mục đích. Agenda cần được gửi ít nhất 24h trước, có ghi rõ objective và expected outcome.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-[13px] font-semibold text-gray-500 mb-6">Bài viết liên quan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Onboard nhân viên mới trong 1 ngày", "Tính lương theo thời gian thực"].map((title) => (
              <a key={title} href="#"
                className="group flex flex-col rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors hover:shadow-sm">
                <div className="text-[11px] font-bold mb-2 px-2 py-0.5 rounded-full self-start" style={{ background: "#EEF2FF", color: BLUE }}>Nhân sự</div>
                <p className="text-[13.5px] font-semibold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">{title}</p>
                <span className="mt-3 flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all" style={{ color: BLUE }}>
                  Đọc <ArrowRight size={12} />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl px-8 py-8 text-center" style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}20` }}>
          <p className="text-[18px] font-bold text-gray-900 mb-2">Thử jobihome miễn phí 14 ngày</p>
          <p className="text-[13.5px] text-gray-400 mb-5">Không cần thẻ tín dụng · Setup 2 phút</p>
          <Link href="/sign-up"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white"
            style={{ background: BLUE }}>
            Bắt đầu miễn phí <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
