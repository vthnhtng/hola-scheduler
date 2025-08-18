// app/api/lecturers/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const lecturers = [
    { name: "Nguyễn Văn A", subject: "Toán", course: "K46", school: "ĐH Bách Khoa" },
    { name: "Trần Thị B", subject: "Lý", course: "K47", school: "ĐH Sư Phạm" },
    { name: "Lê Văn C", subject: "Hóa", course: "K46", school: "ĐH Quốc Gia" },
    { name: "Phạm Thị D", subject: "Sinh", course: "K48", school: "ĐH Y Hà Nội" },
    { name: "Hoàng Văn E", subject: "Tin học", course: "K49", school: "ĐH Công Nghệ" },
  ];

  return NextResponse.json(lecturers);
}
