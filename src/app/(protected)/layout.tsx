"use client";

import AuthProvider from "@/components/AuthContext/AuthProvider";
import Header from "@/components/header/Header";
import styles from "./home.module.scss";
import Nav from "@/components/Nav/Nav";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [expand, setExpand] = useState(false);
	const pathname = usePathname();

	const handleExpandClick = useCallback(() => {
		setExpand((prev) => (prev ? false : prev));
	}, []);

	useEffect(() => {
		handleExpandClick();
	}, [pathname, handleExpandClick]);

	return (
		<AuthProvider>
			<div className={styles.layout}>
				<input
					className={styles.navCheckbox}
					type="checkbox"
					id="nav"
					checked={expand}
					onChange={(e) => setExpand(e.target.checked)}
				/>

				<div className={styles.nav}>
					<Nav />
				</div>

				<div className={styles.main} onClick={handleExpandClick}>
					<Header />

					<main id="content-root" className={styles.content}>
						{children}
					</main>
				</div>
			</div>
		</AuthProvider>
	);
}
