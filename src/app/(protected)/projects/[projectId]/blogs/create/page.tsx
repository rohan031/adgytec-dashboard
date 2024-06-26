"use client";

import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import styles from "./create.module.scss";
import Editor from "../components/editor/Editor";
import { UserContext } from "@/components/AuthContext/authContext";
import { toast } from "react-toastify";
import Details from "../components/details/Details";
import { useParams } from "next/navigation";

export type BlogDetails = {
	title: string;
	summary: string;
	cover: File | null;
	content: string;
	author: string;
};

export interface NewImages {
	path: string;
	file: File;
	isRemoved: boolean;
}

const CreateBlog = () => {
	const userWithRole = useContext(UserContext);
	const user = useMemo(() => {
		return userWithRole ? userWithRole.user : null;
	}, [userWithRole]);

	const params = useParams<{ projectId: string }>();
	const [obj, setObj] = useState<string>("");

	// multi-step blog
	const [step, setStep] = useState<number>(1);
	const [blogDetails, setBlogDetails] = useState<BlogDetails>({
		title: "",
		summary: "",
		content: "",
		cover: null,
		author: "",
	});

	const newImagesRef = useRef<NewImages[]>([]);
	const [deletedImages, setDeletedImages] = useState<string[]>([]); // used when editing existing blog

	const uuidRef = useRef<string | null>(null);

	const generateUUID = useCallback(async () => {
		const url = `${process.env.NEXT_PUBLIC_API}/uuid`;
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
				if (!uuidRef.current) {
					uuidRef.current = res.data.uuid;
				}
			})
			.catch((err) => {
				toast.error(err.message);
			});
	}, [user]);

	useEffect(() => {
		generateUUID();
	}, [generateUUID]);

	const handleNext = () => {
		setStep(2);
	};
	const handlePrevious = () => {
		setStep(1);
	};

	let trial = {
		__html: obj,
	};

	return (
		<div className={styles.blog}>
			<Editor
				uuidRef={uuidRef}
				handleNext={handleNext}
				setBlogDetails={setBlogDetails}
				newImagesRef={newImagesRef}
				setDeletedImages={setDeletedImages}
				hidden={step !== 1}
			/>

			{step === 2 && (
				<div className={styles.blogDetails}>
					<Details
						uuidRef={uuidRef}
						handlePrevious={handlePrevious}
						blogDetails={blogDetails}
						setBlogDetails={setBlogDetails}
						newImagesRef={newImagesRef}
						deletedImages={deletedImages}
					/>
				</div>
			)}
		</div>
	);
};
5;
export default CreateBlog;
