import React, {useEffect, useState} from "react";
import axios from "axios";
import Threads from "../../models/threads"
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThreadDetailsPage from "./ThreadDetailsPage";
import Button from "@mui/material/Button";
import FilterButton from "./FilterButton";
import CreateThreadForm from "./CreateThreadForm";
import Categories from "../../models/categories";

const HomePage: React.FC = () => {
    //For loading in threads
    const [threads, setThreads] = useState<Threads[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //For Opening a Thread Card
    const [threadOpen, setThreadOpen] = useState(false);
    const [selectedThread, setSelectedThread] = useState<Threads | null>(null);

    //For Filtering Buttons
    const [categoryID, setCategoryID] = useState("");
    const [categories, setCategories] = useState<Categories[]>([]);
    const [catError, setCatError] = useState<string | null>(null);

    //For page management
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    //For Creating a new Thread
    const [createThreadOpen, setCreateThreadOpen] = useState(false);

    // Fetch categories when component loads
    useEffect(() => {
        axios.get("http://localhost:8080/categories")
            .then((res) => {
                setCategories(res.data.categories);
                setCatError(null);
            })
            .catch((err) => {
                console.error("Error fetching categories:", err);
                setCatError(err);
            });
    }, []);

    // Fetch threads when page or selectedCategory changes
    useEffect(() => {
        setLoading(true);
        axios.get("http://localhost:8080/threads", {params: {page, categoryID}})
            .then(res => {
                setThreads(res.data.threads || []);
                setTotalPages(res.data.totalPages || 1);
                setLoading(false);
                setError(null);
            })
            .catch(err => {
                setError(err.response?.data?.error);
                setLoading(false);
            })
    }, [page, categoryID])

    const handleThreadOpen = (thread: Threads) => {
        setThreadOpen(true);
        setSelectedThread(thread);
    }

    const handleThreadClose = () => {
        setSelectedThread(null);
        setThreadOpen(false);
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    }

    const onCreateSuccess = (newThread: Threads) =>{
        setThreads((prevThreads) => [newThread, ...prevThreads])
    }

    const handleLike = (id: number)  => {
        axios.patch(`http://localhost:8080/threads/${id}/like`)
            .then(() => {
                setThreads((prevThreads) => {
                    return prevThreads.map((thread) => {
                        return thread.id === id ? {...thread, likes: thread.likes + 1} : thread
                    });
                })
            }).catch((err) => alert(err.error))
    }

    const handleDislike = (id: number)  => {
        axios.patch(`http://localhost:8080/threads/${id}/dislike`)
            .then(() => {
                setThreads((prevThreads) => {
                    return prevThreads.map((thread) => {
                        return thread.id === id ? {...thread, dislikes: thread.dislikes + 1} : thread
                    });
                })
            }).catch((err) => alert(err.error))
    }

    if (loading) {
        return(
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress/>
            </Box>
        )
    }
    if (error) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        )
    }
    return (
        <Box sx={{padding : 4}}>
            <Typography variant="h4" gutterBottom>
                Threads
            </Typography>
            <Button onClick={()=> setCreateThreadOpen(true)}> Create Thread!</Button>
            <CreateThreadForm
                categories={categories}
                open={createThreadOpen}
                onClose={() => setCreateThreadOpen(false)}
                onCreateSuccess={onCreateSuccess}/>
            {/* Category Filter */}
            <FilterButton categories={categories} setPage={setPage} categoryID={categoryID} setCategoryID={setCategoryID} catError={catError} />
            {threads.length === 0 ?
                <Alert severity="info">No threads found for the selected category. Start creating some!</Alert> :
                threads.map((thread: Threads) => (
                <Card key={thread.id}
                      sx={{ marginBottom: 2, cursor: "pointer", "&:hover": {boxShadow: 6}}}
                      onClick={() => handleThreadOpen(thread)}>
                    <CardContent>
                        <Typography variant="h5">{thread.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {thread.content}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Likes: {thread.likes} | Dislikes: {thread.dislikes}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLike(thread.id);
                            }}>
                            <ThumbUpIcon/>
                        </IconButton>
                        <IconButton
                            size="small"
                            color="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDislike(thread.id)
                            }}
                        >
                            <ThumbDownIcon/>
                        </IconButton>
                    </CardActions>
                </Card>
            ))}
            {/* Pagination Controls */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    sx={{ mx: 1 }}
                >
                    Previous
                </Button>
                <Typography sx={{ mx: 2 }}>Page {page} of {totalPages}</Typography>
                <Button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    sx={{ mx: 1 }}
                >
                    Next
                </Button>
            </Box>
            <ThreadDetailsPage threadOpen={threadOpen} handleCloseDialog={handleThreadClose} selectedThread={selectedThread}/>
        </Box>
    );
}

export default HomePage;