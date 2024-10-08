"use client";

import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import styles from "./projects.module.scss";
import Container from "@/components/Container/Container";
import Loader from "@/components/Loader/Loader";
import { UserContext } from "@/components/AuthContext/authContext";
import ProjectElement from "./components/ProjectElement/ProjectElement";
import { toast } from "react-toastify";

export interface Project {
	projectId: string;
	projectName: string;
	createdAt: string;
	cover: string;
}

const ProjectAdmin = () => {
	const userWithRole = useContext(UserContext);
	const user = useMemo(
		() => (userWithRole ? userWithRole.user : null),
		[userWithRole]
	);

	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	const getAllProjects = useCallback(async () => {
		setLoading(true);
		setProjects([]);

		const url = `${process.env.NEXT_PUBLIC_API}/projects`;
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

				setProjects(res.data);
			})
			.catch((err) => {
				toast.error(err.message);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [user]);

	useEffect(() => {
		getAllProjects();
	}, [getAllProjects]);

	let elements: React.JSX.Element[] = [];
	projects.forEach((project, ind) => {
		const { projectId, projectName } = project;
		let element = (
			<ProjectElement key={project.projectId} project={project} />
		);

		if (search.length === 0) {
			elements.push(element);
			return;
		}

		if (
			projectId.toLowerCase().includes(search.toLowerCase()) ||
			projectName.toLowerCase().includes(search.toLowerCase())
		)
			elements.push(element);
	});

	return (
		<>
			<Container type="full" className={styles.project}>
				<div
					className={styles.header}
					title="search project by project id or project name"
				>
					<h2>Project Overview</h2>

					<input
						type="text"
						placeholder="Type to search..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{loading ? (
					<div data-load="true">
						<Loader />
					</div>
				) : projects.length === 0 ? (
					<div data-empty="true">
						<h3>There are no projects to display at this time.</h3>
					</div>
				) : elements.length === 0 ? (
					<div data-empty="true">
						<p>
							There is no project named{" "}
							<span className="italic">
								<q>{search}</q>
							</span>
						</p>
					</div>
				) : (
					<div className={styles.project_list}>{elements}</div>
				)}
			</Container>
		</>
	);
};

export default ProjectAdmin;
