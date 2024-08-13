"use client";

import { UserContext } from "@/components/AuthContext/authContext";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { toast } from "react-toastify";
import styles from "./blogs.module.scss";
import Link from "next/link";
import { useParams } from "next/navigation";
import BlogItem from "./components/blogItem/BlogItem";
import Loader from "@/components/Loader/Loader";
import Container from "@/components/Container/Container";

export interface Blog {
	title: string;
	summary?: string;
	author: string;
	blogId: string;
	createdAt: string;
	cover: string;
}

const Blogs = () => {
	const userWithRole = useContext(UserContext);
	const user = useMemo(() => {
		return userWithRole ? userWithRole.user : null;
	}, [userWithRole]);

	const params = useParams<{ projectId: string }>();

	const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
	const [search, setSearch] = useState<string>("");
	const [loading, setLoading] = useState(true);

	const getAllBlogs = useCallback(async () => {
		const url = `${process.env.NEXT_PUBLIC_API}/services/blogs/${params.projectId}`;
		const token = await user?.getIdToken();
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		fetch(url, {
			method: "GET",
			headers,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.error) throw new Error(res.message);
				setAllBlogs(res.data);
			})
			.catch((err) => {
				toast.error(err.message);
			})
			.finally(() => setLoading(false));
	}, [user, params.projectId]);

	useEffect(() => {
		getAllBlogs();
	}, [getAllBlogs]);

	const elements: JSX.Element[] = [];
	allBlogs.forEach((blog) => {
		const { blogId, title, author } = blog;
		const element = (
			<BlogItem key={blogId} blog={blog} setAllBlogs={setAllBlogs} />
		);

		if (search.length === 0) {
			elements.push(element);
			return;
		}

		if (
			blogId.toLowerCase().includes(search.toLowerCase()) ||
			title.toLowerCase().includes(search.toLowerCase()) ||
			author.toLowerCase().includes(search.toLowerCase())
		)
			elements.push(element);
	});

	return (
		<div className={styles.blogs}>
			<div
				className={styles.search}
				title="search blogs by id, title or author"
			>
				<h2>Blog Overview</h2>

				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Type to search..."
				/>
			</div>

			{/* list all blogs */}
			<div
				className={styles.container}
				data-empty={allBlogs.length === 0 || elements.length === 0}
				data-load={loading}
			>
				{loading ? (
					<Loader />
				) : allBlogs.length === 0 ? (
					<h3>No blogs exist for this project</h3>
				) : elements.length === 0 ? (
					<p>
						There is no blog with title{" "}
						<span className="italic">
							<q>{search}</q>
						</span>
					</p>
				) : (
					<Container type="full" className={styles.table}>
						<div className={styles.heading}>
							<h4>Details</h4>

							<h4>Edit</h4>

							<h4>Delete</h4>
						</div>

						{elements}
					</Container>
				)}
			</div>
		</div>
	);
};

export default Blogs;
