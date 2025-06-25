import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Xếp lịch dạy - Trung tâm Giáo dục Quốc phòng và An ninh",
	description: "Xếp lịch dạy - Trung tâm Giáo dục Quốc phòng và An ninh",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
