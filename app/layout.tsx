import type { Metadata } from "next";
import { Inter } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

const inter = Inter({
	variable: "--font-inter",
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
				className={`${inter.variable} antialiased`}
			>
				<AuthProvider>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
