"use client";

import { useParams, useSearchParams } from "next/navigation";
import styles from "./album.module.scss";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { UserContext } from "@/components/AuthContext/authContext";
import Loader from "@/components/Loader/Loader";
import { toast } from "react-toastify";
import { blurDataUrl, getNow } from "@/helpers/helpers";
import { useIntersection } from "@/hooks/intersetion-observer/intersection-observer";
import {
	handleEscModal,
	handleModalClose,
	lightDismiss,
} from "@/helpers/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useFile } from "@/components/FileInput/hooks/useFile";
import FileInput from "@/components/FileInput/FileInput";
import Image from "next/image";
import Container from "@/components/Container/Container";
import { createPortal } from "react-dom";

export interface Picture {
	id: string;
	image: string;
	createdAt: string;
}

interface AddedPicture {
	id: string;
	image: string;
}

const LIMIT = 20;
const UPLOAD_LIMIT = 5;
const SELECT_LIMIT = 50;

const AlbumPage = () => {
	const userWithRole = useContext(UserContext);
	const user = useMemo(() => {
		return userWithRole ? userWithRole.user : null;
	}, [userWithRole]);

	const params = useParams<{
		projectId: string;
		albumId: string;
	}>();
	const albumName = useSearchParams().get("name");

	const [images, setImages] = useFile();

	const [loading, setLoading] = useState(true);
	const [allPictures, setAllPictures] = useState<Picture[][]>([]);
	const [addedPictures, setAddedPictures] = useState<AddedPicture[]>([]);
	const [allFetched, setAllFetched] = useState(false);

	const [adding, setAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const activeUploadRef = useRef<number>(0);
	const currIndRef = useRef<number>(0);
	const uploadStatusRef = useRef({
		success: 0,
		failure: 0,
	});

	const [manage, setManage] = useState(false);
	const [selected, setSelected] = useState<string[]>([]);
	const [deleting, setDeleting] = useState(false);

	const initRef = useRef(false);

	const addImageModalRef = useRef<HTMLDialogElement | null>(null);
	const handleClose = () => handleModalClose(addImageModalRef);

	const getAllPictures = useCallback(
		async (cursor: string, init?: boolean) => {
			if (allFetched) return;

			if (initRef.current && init) return;

			if (init) initRef.current = init;

			const url = `${process.env.NEXT_PUBLIC_API}/services/gallery/${params.projectId}/album/${params.albumId}?cursor=${cursor}`;
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
					let len = res.data.length;
					if (len < LIMIT) {
						setAllFetched(true);
					}
					if (len === 0) return;

					setAllPictures((prev) => {
						if (prev.length === 0) return [res.data];

						return [...prev, res.data];
					});

					// setAllPictures((prev) => {
					// 	const newPiectures = res.data.filter(
					// 		(picture: Picture) =>
					// 			!prev.some(
					// 				(exitingPicture) =>
					// 					exitingPicture.id === picture.id
					// 			)
					// 	);
					// 	return [...prev, ...newPiectures];
					// });
				})
				.catch((err) => {
					toast.error(err.message);
				})
				.finally(() => setLoading(false));
		},
		[user, params.projectId, params.albumId, allFetched]
	);

	const callback: IntersectionObserverCallback = useCallback(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					let lastInd = allPictures.length;
					if (lastInd <= 0) return;

					let lastItemInd = allPictures[lastInd - 1].length;
					if (lastItemInd < LIMIT) return;

					let newCursor = new Date(
						allPictures[lastInd - 1][lastItemInd - 1].createdAt
					).toISOString();
					getAllPictures(newCursor);
				}
			});
		},
		[allPictures, getAllPictures]
	);

	const elementRef = useIntersection(
		callback,
		document.getElementById("content-root")
	);

	useEffect(() => {
		getAllPictures(getNow(), true);
	}, [getAllPictures]);

	const uploadImages = async () => {
		if (currIndRef.current >= images.length) {
			// all images are done
			if (activeUploadRef.current === 0) {
				setImages([]);
				setAdding(false);
				handleClose();

				if (uploadStatusRef.current.success > 0)
					toast.success("successfully added images to the album");
				else toast.error("failed to upload images");
			}
			return;
		}

		if (activeUploadRef.current >= UPLOAD_LIMIT) return;

		const url = `${process.env.NEXT_PUBLIC_API}/services/gallery/${params.projectId}/album/${params.albumId}`;
		const token = await user?.getIdToken();
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		const len = images.length;

		while (
			activeUploadRef.current < UPLOAD_LIMIT &&
			currIndRef.current < len
		) {
			const file = images[currIndRef.current].file;
			const image = images[currIndRef.current].url;

			const formData = new FormData();
			formData.append("photo", file);

			activeUploadRef.current++;
			currIndRef.current++;

			fetch(url, {
				method: "POST",
				headers,
				body: formData,
			})
				.then((res) => res.json())
				.then((res) => {
					if (res.error) throw new Error(res.message);

					const id = res.data.id;
					setAddedPictures((prev) => [{ id, image }, ...prev]);
					uploadStatusRef.current.success += 1;
				})
				.catch((err) => {
					console.error("failed to upload one image");
					uploadStatusRef.current.failure += 1;
				})
				.finally(() => {
					activeUploadRef.current--;

					uploadImages();
				});
		}
	};

	const handleAdd = () => {
		if (images.length === 0) {
			setError("Please select at least one image to add to this album.");
			return;
		}

		setError(null);
		setAdding(true);
		activeUploadRef.current = 0;
		currIndRef.current = 0;
		uploadStatusRef.current = {
			success: 0,
			failure: 0,
		};

		uploadImages();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const checked = e.target.checked;

		if (checked) {
			setSelected((prev) => {
				return [...prev, value];
			});
		} else {
			// remove from selected
			setSelected((prev) => {
				return prev.filter((item) => item !== value);
			});
		}
	};

	const handleDelete = async () => {
		if (selected.length === 0) {
			toast.error(
				"You need to select at least one item to perform this action."
			);
			return;
		}

		const url = `${process.env.NEXT_PUBLIC_API}/services/gallery/${params.projectId}/album/${params.albumId}`;
		const token = await user?.getIdToken();
		const headers = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};
		const body = JSON.stringify({
			id: selected,
		});

		fetch(url, {
			method: "DELETE",
			headers,
			body,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.error) throw new Error(res.message);

				toast.success(res.message);

				setAddedPictures((prev) => {
					return prev.filter(
						(picture) => !selected.includes(picture.id)
					);
				});

				const newAllPictures = allPictures
					.map((pictures) =>
						pictures.filter(
							(picture) => !selected.includes(picture.id)
						)
					)
					.filter((pictures) => pictures.length > 0);

				setAllPictures(newAllPictures);
				setSelected([]);
				setManage(false);
			})
			.catch((err) => {
				toast.error(err.message);
			})
			.finally(() => setDeleting(false));
	};

	return (
		<>
			<dialog
				ref={addImageModalRef}
				onKeyDown={(e) => {
					if (!adding) return;
					handleEscModal(e);
				}}
				onClick={(e) => {
					if (adding) return;
					lightDismiss(e);
				}}
				className={styles.modal}
			>
				<div className="modal">
					<div className="modal-menu">
						<h2>Add Images</h2>

						<button
							data-type="link"
							onClick={handleClose}
							title="close"
							// disabled={coverUpdating}
						>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>

					<div className={styles.addImages}>
						<label>Select Image</label>

						<FileInput
							setFiles={setImages}
							multiple={true}
							disabled={adding}
							files={images}
							id={params.albumId}
						/>

						{error && <p className="error">{error}</p>}
					</div>

					<div className="action">
						<button
							data-type="link"
							disabled={adding}
							onClick={handleClose}
						>
							Cancel
						</button>

						<button
							data-type="button"
							disabled={adding || images.length === 0}
							data-load={adding}
							onClick={handleAdd}
							data-variant="primary"
						>
							{adding ? <Loader variant="small" /> : "Add"}
						</button>
					</div>
				</div>
			</dialog>

			{manage &&
				createPortal(
					<div className={styles.selection}>
						<h4>Selected Images: {selected.length}</h4>
						<button
							data-type="link"
							data-variant="error"
							title="delete"
							disabled={selected.length === 0 || deleting}
							onClick={handleDelete}
						>
							{deleting ? (
								<Loader variant="small" />
							) : (
								<FontAwesomeIcon icon={faTrashCan} />
							)}
						</button>
					</div>,
					document.body
				)}

			<div className={styles.album}>
				<div className={styles.heading}>
					<h2>{albumName}</h2>

					<button
						disabled={loading || deleting}
						data-type="button"
						data-variant="secondary"
						onClick={() => addImageModalRef.current?.showModal()}
					>
						Add
					</button>
				</div>

				<Container
					type="full"
					className={styles.container}
					data-load={loading}
					data-empty={
						allPictures.length === 0 && addedPictures.length === 0
					}
				>
					{loading ? (
						<Loader />
					) : allPictures.length === 0 &&
					  addedPictures.length === 0 ? (
						<h3>There are no photos here.</h3>
					) : (
						<>
							<div className={styles.action}>
								<button
									data-type="link"
									data-variant={manage ? "error" : "primary"}
									onClick={() => {
										if (manage) setSelected([]);

										setManage((prev) => !prev);
									}}
									disabled={deleting}
								>
									{manage ? "Cancel" : "Manage"}
								</button>
							</div>

							<div className={styles.images}>
								<div className={styles.imagesChild}>
									{addedPictures.map((picture) => {
										return (
											<div
												className={styles.item}
												key={picture.id}
												data-manage={manage}
											>
												<img
													data-manage={manage}
													src={picture.image}
													alt=""
													onClick={() => {
														if (manage) return;
														window.open(
															picture.image,
															"_blank"
														);
													}}
												/>

												{manage && (
													<label>
														<input
															type="checkbox"
															value={picture.id}
															onChange={
																handleInputChange
															}
															disabled={
																selected.length ===
																	SELECT_LIMIT &&
																!selected.includes(
																	picture.id
																)
															}
														/>
													</label>
												)}
											</div>
										);
									})}
								</div>

								{allPictures.map((pictures, ind) => {
									return (
										<div
											key={`allpictures${ind}${pictures.length}`}
											className={styles.imagesChild}
										>
											{pictures.map((picture, ind) => {
												return (
													<div
														className={styles.item}
														key={picture.id}
														data-manage={manage}
													>
														<img
															data-manage={manage}
															width="730"
															height="640"
															src={picture.image}
															onClick={() => {
																if (manage)
																	return;
																window.open(
																	picture.image,
																	"_blank"
																);
															}}
															alt=""
														/>

														{manage && (
															<label>
																<input
																	type="checkbox"
																	value={
																		picture.id
																	}
																	onChange={
																		handleInputChange
																	}
																	disabled={
																		selected.length ===
																			SELECT_LIMIT &&
																		!selected.includes(
																			picture.id
																		)
																	}
																/>
															</label>
														)}
													</div>
												);
											})}
										</div>
									);
								})}
							</div>

							<div ref={elementRef}></div>
						</>
					)}
				</Container>
			</div>
		</>
	);
};

export default AlbumPage;
