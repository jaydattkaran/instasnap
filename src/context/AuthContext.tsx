import { getCurrentUser } from "@/lib/appwrite/api";
import { IContextType, IUser } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<IUser>(INITIAL_USER);
    const [isLoading, setIsLoading] = useState(true); // Set initial loading to true
    const [isAuthenticated, setIsAuthenticated] = useState(false);   
    
    const navigate = useNavigate();

    const checkAuthUser = async () => {
        setIsLoading(true);
        try {
            const currentAccount = await getCurrentUser();

            if(currentAccount){
                setUser({
                    id: currentAccount.$id,
                    name: currentAccount.name,
                    username: currentAccount.username,
                    email: currentAccount.email,
                    imageUrl: currentAccount.imageUrl,
                    bio: currentAccount.bio
                });

                setIsAuthenticated(true);
                return true;
            }

            // navigate('/sign-in');
            return false;
        } catch (error) {
            console.error("Authentication check failed:", error);
            setIsAuthenticated(false);
            setUser(INITIAL_USER);
            // navigate('/sign-in');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const checkCookieFallback = () => {
            const cookieFallback = localStorage.getItem('cookieFallback');
            if(cookieFallback === '[]' || cookieFallback === null) {
                navigate('/sign-in');
            }
        };

        checkCookieFallback();
        checkAuthUser();
    }, []);

    const value = {
        user,
        setUser,
        isLoading,
        isAuthenticated,
        setIsAuthenticated,
        checkAuthUser
    }

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);