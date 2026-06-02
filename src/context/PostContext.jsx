import { createContext, useContext, useState } from "react";
import { chatList } from "../mocks/data";

const PostContext = createContext(null);

export function PostProvider({ children }) {
  const [posts, setPosts] = useState([...chatList]);

  const addPost = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const addReply = (postId, reply) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
      )
    );
  };

  return (
    <PostContext.Provider value={{ posts, addPost, addReply }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error("usePosts must be used within PostProvider");
  return ctx;
}
