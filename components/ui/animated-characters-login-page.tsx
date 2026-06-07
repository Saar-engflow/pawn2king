"use client"; 
 
 import { useState, useEffect, useRef } from "react"; 
 import Image from "next/image";
 import { useRouter } from "next/navigation";
 import { createClient } from "@/utils/supabase/client";
 import { Button } from "@/components/ui/button"; 
 import { Input } from "@/components/ui/input"; 
 import { Label } from "@/components/ui/label"; 
 import { Checkbox } from "@/components/ui/checkbox"; 
 import { Eye, EyeOff, Mail } from "lucide-react"; 
 import { cn } from "@/lib/utils"; 
 
 
 interface PupilProps { 
   size?: number; 
   maxDistance?: number; 
   pupilColor?: string; 
   forceLookX?: number; 
   forceLookY?: number; 
 } 
 
 const Pupil = ({ 
   size = 12, 
   maxDistance = 5, 
   pupilColor = "black", 
   forceLookX, 
   forceLookY 
 }: PupilProps) => { 
   const [mouseX, setMouseX] = useState<number>(0); 
   const [mouseY, setMouseY] = useState<number>(0); 
   const pupilRef = useRef<HTMLDivElement>(null); 
 
   useEffect(() => { 
     const handleMouseMove = (e: MouseEvent) => { 
       setMouseX(e.clientX); 
       setMouseY(e.clientY); 
     }; 
 
     window.addEventListener("mousemove", handleMouseMove); 
 
     return () => { 
       window.removeEventListener("mousemove", handleMouseMove); 
     }; 
   }, []); 
 
   const calculatePupilPosition = () => { 
     if (!pupilRef.current) return { x: 0, y: 0 }; 
 
     // If forced look direction is provided, use that instead of mouse tracking 
     if (forceLookX !== undefined && forceLookY !== undefined) { 
       return { x: forceLookX, y: forceLookY }; 
     } 
 
     const pupil = pupilRef.current.getBoundingClientRect(); 
     const pupilCenterX = pupil.left + pupil.width / 2; 
     const pupilCenterY = pupil.top + pupil.height / 2; 
 
     const deltaX = mouseX - pupilCenterX; 
     const deltaY = mouseY - pupilCenterY; 
     const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance); 
 
     const angle = Math.atan2(deltaY, deltaX); 
     const x = Math.cos(angle) * distance; 
     const y = Math.sin(angle) * distance; 
 
     return { x, y }; 
   }; 
 
   const pupilPosition = calculatePupilPosition(); 
 
   return ( 
     <div 
       ref={pupilRef} 
       className="rounded-full" 
       style={{ 
         width: `${size}px`, 
         height: `${size}px`, 
         backgroundColor: pupilColor, 
         transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`, 
         transition: 'transform 0.1s ease-out', 
       }} 
     /> 
   ); 
 }; 
 
 
 
 
 interface EyeBallProps { 
   size?: number; 
   pupilSize?: number; 
   maxDistance?: number; 
   eyeColor?: string; 
   pupilColor?: string; 
   isBlinking?: boolean; 
   forceLookX?: number; 
   forceLookY?: number; 
 } 
 
 const EyeBall = ({ 
   size = 48, 
   pupilSize = 16, 
   maxDistance = 10, 
   eyeColor = "white", 
   pupilColor = "black", 
   isBlinking = false, 
   forceLookX, 
   forceLookY 
 }: EyeBallProps) => { 
   const [mouseX, setMouseX] = useState<number>(0); 
   const [mouseY, setMouseY] = useState<number>(0); 
   const eyeRef = useRef<HTMLDivElement>(null); 
 
   useEffect(() => { 
     const handleMouseMove = (e: MouseEvent) => { 
       setMouseX(e.clientX); 
       setMouseY(e.clientY); 
     }; 
 
     window.addEventListener("mousemove", handleMouseMove); 
 
     return () => { 
       window.removeEventListener("mousemove", handleMouseMove); 
     }; 
   }, []); 
 
   const calculatePupilPosition = () => { 
     if (!eyeRef.current) return { x: 0, y: 0 }; 
 
     // If forced look direction is provided, use that instead of mouse tracking 
     if (forceLookX !== undefined && forceLookY !== undefined) { 
       return { x: forceLookX, y: forceLookY }; 
     } 
 
     const eye = eyeRef.current.getBoundingClientRect(); 
     const eyeCenterX = eye.left + eye.width / 2; 
     const eyeCenterY = eye.top + eye.height / 2; 
 
     const deltaX = mouseX - eyeCenterX; 
     const deltaY = mouseY - eyeCenterY; 
     const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance); 
 
     const angle = Math.atan2(deltaY, deltaX); 
     const x = Math.cos(angle) * distance; 
     const y = Math.sin(angle) * distance; 
 
     return { x, y }; 
   }; 
 
   const pupilPosition = calculatePupilPosition(); 
 
   return ( 
     <div 
       ref={eyeRef} 
       className="rounded-full flex items-center justify-center transition-all duration-150" 
       style={{ 
         width: `${size}px`, 
         height: isBlinking ? '2px' : `${size}px`, 
         backgroundColor: eyeColor, 
         overflow: 'hidden', 
       }} 
     > 
       {!isBlinking && ( 
         <div 
           className="rounded-full" 
           style={{ 
             width: `${pupilSize}px`, 
             height: `${pupilSize}px`, 
             backgroundColor: pupilColor, 
             transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`, 
             transition: 'transform 0.1s ease-out', 
           }} 
         /> 
       )} 
     </div> 
   ); 
 }; 
 
 
 
 
 
 export default function LoginPage() { 
   const router = useRouter();
   const supabase = createClient();
   const [mode, setMode] = useState<"signin" | "signup">("signin");
   const [showPassword, setShowPassword] = useState(false); 
   const [email, setEmail] = useState(""); 
   const [password, setPassword] = useState(""); 
   const [username, setUsername] = useState("");
   const [error, setError] = useState(""); 
   const [isLoading, setIsLoading] = useState(false); 
   const [mouseX, setMouseX] = useState<number>(0); 
   const [mouseY, setMouseY] = useState<number>(0); 
   const [isPurpleBlinking, setIsPurpleBlinking] = useState(false); 
   const [isBlackBlinking, setIsBlackBlinking] = useState(false); 
   const [isTyping, setIsTyping] = useState(false); 
   const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false); 
   const [isPurplePeeking, setIsPurplePeeking] = useState(false); 
   const purpleRef = useRef<HTMLDivElement>(null); 
   const blackRef = useRef<HTMLDivElement>(null); 
   const yellowRef = useRef<HTMLDivElement>(null); 
   const orangeRef = useRef<HTMLDivElement>(null); 
 
   useEffect(() => { 
     const handleMouseMove = (e: MouseEvent) => { 
       setMouseX(e.clientX); 
       setMouseY(e.clientY); 
     }; 
 
     window.addEventListener("mousemove", handleMouseMove); 
     return () => window.removeEventListener("mousemove", handleMouseMove); 
   }, []); 
 
   // Blinking effect for purple character 
   useEffect(() => { 
     const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds 
 
     const scheduleBlink = () => { 
       const blinkTimeout = setTimeout(() => { 
         setIsPurpleBlinking(true); 
         setTimeout(() => { 
           setIsPurpleBlinking(false); 
           scheduleBlink(); 
         }, 150); // Blink duration 150ms 
       }, getRandomBlinkInterval()); 
 
       return blinkTimeout; 
     }; 
 
     const timeout = scheduleBlink(); 
     return () => clearTimeout(timeout); 
   }, []); 
 
   // Blinking effect for black character 
   useEffect(() => { 
     const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds 
 
     const scheduleBlink = () => { 
       const blinkTimeout = setTimeout(() => { 
         setIsBlackBlinking(true); 
         setTimeout(() => { 
           setIsBlackBlinking(false); 
           scheduleBlink(); 
         }, 150); // Blink duration 150ms 
       }, getRandomBlinkInterval()); 
 
       return blinkTimeout; 
     }; 
 
     const timeout = scheduleBlink(); 
     return () => clearTimeout(timeout); 
   }, []); 
 
   // Looking at each other animation when typing starts 
   useEffect(() => { 
     if (isTyping) { 
       setIsLookingAtEachOther(true); 
       const timer = setTimeout(() => { 
         setIsLookingAtEachOther(false); 
       }, 800); // Look at each other for 1.5 seconds, then back to tracking mouse 
       return () => clearTimeout(timer); 
     } else { 
       setIsLookingAtEachOther(false); 
     } 
   }, [isTyping]); 
 
   // Purple sneaky peeking animation when typing password and it's visible 
   useEffect(() => { 
     if (password.length > 0 && showPassword) { 
       const schedulePeek = () => { 
         const peekInterval = setTimeout(() => { 
           setIsPurplePeeking(true); 
           setTimeout(() => { 
             setIsPurplePeeking(false); 
           }, 800); // Peek for 800ms 
         }, Math.random() * 3000 + 2000); // Random peek every 2-5 seconds 
         return peekInterval; 
       }; 
 
       const firstPeek = schedulePeek(); 
       return () => clearTimeout(firstPeek); 
     } else { 
       setIsPurplePeeking(false); 
     } 
   }, [password, showPassword, isPurplePeeking]); 
 
   const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => { 
     if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }; 
 
     const rect = ref.current.getBoundingClientRect(); 
     const centerX = rect.left + rect.width / 2; 
     const centerY = rect.top + rect.height / 3; // Focus on head area 
 
     const deltaX = mouseX - centerX; 
     const deltaY = mouseY - centerY; 
 
     // Face movement (limited range) 
     const faceX = Math.max(-15, Math.min(15, deltaX / 20)); 
     const faceY = Math.max(-10, Math.min(10, deltaY / 30)); 
 
     // Body lean (skew for lean while keeping bottom straight) - negative to lean towards mouse 
     const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120)); 
 
     return { faceX, faceY, bodySkew }; 
   }; 
 
   const purplePos = calculatePosition(purpleRef); 
   const blackPos = calculatePosition(blackRef); 
   const yellowPos = calculatePosition(yellowRef); 
   const orangePos = calculatePosition(orangeRef); 
 
   const handleSubmit = async (e: React.FormEvent) => { 
     e.preventDefault(); 
     setError(""); 
     setIsLoading(true); 
 
     try {
       if (mode === "signup") {
         const { error: signUpError } = await supabase.auth.signUp({
           email,
           password,
           options: {
             data: {
               username: username,
               full_name: username, // Default to username for now
             },
           },
         });
         if (signUpError) throw signUpError;
         alert("Signup successful! Please check your email for verification.");
       } else {
         const { error: signInError } = await supabase.auth.signInWithPassword({
           email,
           password,
         });
         if (signInError) throw signInError;
         router.push("/dashboard");
       }
     } catch (err: any) {
       setError(err.message || "An error occurred during authentication.");
     } finally {
       setIsLoading(false);
     }
   }; 
 
   return ( 
     <div className="min-h-screen grid lg:grid-cols-2"> 
       {/* Left Content Section */} 
       <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground"> 
         <div className="relative z-20"> 
           <div className="flex items-center gap-2 text-lg font-semibold"> 
             <div className="size-10 relative"> 
               <Image 
                 src="/pawn2king.png" 
                 alt="pawn2king logo" 
                 fill 
                 className="object-contain brightness-0 invert"
               /> 
             </div> 
             <span>pawn2king</span> 
           </div> 
         </div> 
 
         <div className="relative z-20 flex items-end justify-center h-[500px]"> 
           {/* Cartoon Characters */} 
           <div className="relative" style={{ width: '550px', height: '400px' }}> 
             {/* Purple tall rectangle character - Back layer */} 
             <div 
               ref={purpleRef} 
               className="absolute bottom-0 transition-all duration-700 ease-in-out" 
               style={{ 
                 left: '70px', 
                 width: '180px', 
                 height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px', 
                 backgroundColor: '#6C3FF5', 
                 borderRadius: '10px 10px 0 0', 
                 zIndex: 1, 
                 transform: (password.length > 0 && showPassword) 
                   ? `skewX(0deg)` 
                   : (isTyping || (password.length > 0 && !showPassword)) 
                     ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                     : `skewX(${purplePos.bodySkew || 0}deg)`, 
                 transformOrigin: 'bottom center', 
               }} 
             > 
               {/* Eyes */} 
               <div 
                 className="absolute flex gap-8 transition-all duration-700 ease-in-out" 
                 style={{ 
                   left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`, 
                   top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`, 
                 }} 
               > 
                 <EyeBall 
                   size={18} 
                   pupilSize={7} 
                   maxDistance={5} 
                   eyeColor="white" 
                   pupilColor="#2D2D2D" 
                   isBlinking={isPurpleBlinking} 
                   forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} 
                   forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} 
                 /> 
                 <EyeBall 
                   size={18} 
                   pupilSize={7} 
                   maxDistance={5} 
                   eyeColor="white" 
                   pupilColor="#2D2D2D" 
                   isBlinking={isPurpleBlinking} 
                   forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} 
                   forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} 
                 /> 
               </div> 
             </div> 
 
             {/* Black tall rectangle character - Middle layer */} 
             <div 
               ref={blackRef} 
               className="absolute bottom-0 transition-all duration-700 ease-in-out" 
               style={{ 
                 left: '240px', 
                 width: '120px', 
                 height: '310px', 
                 backgroundColor: '#2D2D2D', 
                 borderRadius: '8px 8px 0 0', 
                 zIndex: 2, 
                 transform: (password.length > 0 && showPassword) 
                   ? `skewX(0deg)` 
                   : isLookingAtEachOther 
                     ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` 
                     : (isTyping || (password.length > 0 && !showPassword)) 
                       ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                       : `skewX(${blackPos.bodySkew || 0}deg)`, 
                 transformOrigin: 'bottom center', 
               }} 
             > 
               {/* Eyes */} 
               <div 
                 className="absolute flex gap-6 transition-all duration-700 ease-in-out" 
                 style={{ 
                   left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`, 
                   top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`, 
                 }} 
               > 
                 <EyeBall 
                   size={16} 
                   pupilSize={6} 
                   maxDistance={4} 
                   eyeColor="white" 
                   pupilColor="#2D2D2D" 
                   isBlinking={isBlackBlinking} 
                   forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} 
                   forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} 
                 /> 
                 <EyeBall 
                   size={16} 
                   pupilSize={6} 
                   maxDistance={4} 
                   eyeColor="white" 
                   pupilColor="#2D2D2D" 
                   isBlinking={isBlackBlinking} 
                   forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} 
                   forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} 
                 /> 
               </div> 
             </div> 
 
             {/* Orange semi-circle character - Front left */} 
             <div 
               ref={orangeRef} 
               className="absolute bottom-0 transition-all duration-700 ease-in-out" 
               style={{ 
                 left: '0px', 
                 width: '240px', 
                 height: '200px', 
                 zIndex: 3, 
                 backgroundColor: '#FF9B6B', 
                 borderRadius: '120px 120px 0 0', 
                 transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`, 
                 transformOrigin: 'bottom center', 
               }} 
             > 
               {/* Eyes - just pupils, no white */} 
               <div 
                 className="absolute flex gap-8 transition-all duration-200 ease-out" 
                 style={{ 
                   left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`, 
                   top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`, 
                 }} 
               > 
                 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} /> 
                 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} /> 
               </div> 
             </div> 
 
             {/* Yellow tall rectangle character - Front right */} 
             <div 
               ref={yellowRef} 
               className="absolute bottom-0 transition-all duration-700 ease-in-out" 
               style={{ 
                 left: '310px', 
                 width: '140px', 
                 height: '230px', 
                 backgroundColor: '#E8D754', 
                 borderRadius: '70px 70px 0 0', 
                 zIndex: 4, 
                 transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`, 
                 transformOrigin: 'bottom center', 
               }} 
             > 
               {/* Eyes - just pupils, no white */} 
               <div 
                 className="absolute flex gap-6 transition-all duration-200 ease-out" 
                 style={{ 
                   left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`, 
                   top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`, 
                 }} 
               > 
                 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} /> 
                 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} /> 
               </div> 
               {/* Horizontal line for mouth */} 
               <div 
                 className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out" 
                 style={{ 
                   left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`, 
                   top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`, 
                 }} 
               /> 
             </div> 
           </div> 
         </div> 
 
       </div> 
 
       {/* Right Form Section */} 
       <div className="flex items-center justify-center p-8"> 
         <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"> 
           <div className="flex flex-col items-center text-center"> 
             <div className="size-20 relative mb-4"> 
               <Image 
                 src="/pawn2king.png" 
                 alt="pawn2king logo" 
                 fill 
                 className="object-contain"
               /> 
             </div> 
             <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic mb-2">
               pawn2king
             </h1>
           </div> 
 
           <form onSubmit={handleSubmit} className="space-y-4"> 
             {mode === "signup" && (
               <div className="space-y-2"> 
                 <Label htmlFor="username">Username</Label> 
                 <Input 
                   id="username" 
                   placeholder="king_pawn" 
                   type="text" 
                   disabled={isLoading} 
                   value={username} 
                   onChange={(e) => setUsername(e.target.value)} 
                   required 
                 /> 
               </div> 
             )}
             <div className="space-y-2"> 
               <Label htmlFor="email">Email</Label> 
               <div className="relative"> 
                 <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> 
                 <Input 
                   id="email" 
                   placeholder="m@example.com" 
                   type="email" 
                   autoCapitalize="none" 
                   autoComplete="email" 
                   autoCorrect="off" 
                   disabled={isLoading} 
                   className="pl-10" 
                   value={email} 
                   onChange={(e) => { 
                     setEmail(e.target.value); 
                     setIsTyping(e.target.value.length > 0); 
                   }} 
                   onFocus={() => setIsTyping(true)} 
                   onBlur={() => setIsTyping(false)} 
                   required 
                 /> 
               </div> 
             </div> 
             <div className="space-y-2"> 
               <Label htmlFor="password">Password</Label> 
               <div className="relative"> 
                 <Input 
                   id="password" 
                   type={showPassword ? "text" : "password"} 
                   disabled={isLoading} 
                   value={password} 
                   onChange={(e) => setPassword(e.target.value)} 
                   required 
                 /> 
                 <Button 
                   type="button" 
                   variant="ghost" 
                   size="sm" 
                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                   onClick={() => setShowPassword(!showPassword)} 
                 > 
                   {showPassword ? ( 
                     <EyeOff className="h-4 w-4 text-muted-foreground" /> 
                   ) : ( 
                     <Eye className="h-4 w-4 text-muted-foreground" /> 
                   )} 
                   <span className="sr-only"> 
                     {showPassword ? "Hide password" : "Show password"} 
                   </span> 
                 </Button> 
               </div> 
             </div> 
 
             {error && ( 
               <p className="text-sm font-medium text-destructive">{error}</p> 
             )} 
 
             <div className="flex items-center space-x-2"> 
               <Checkbox id="terms" /> 
               <Label 
                 htmlFor="terms" 
                 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" 
               > 
                 Remember me 
               </Label> 
             </div> 
 
             <Button className="w-full" type="submit" disabled={isLoading}> 
               {isLoading && ( 
                 <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> 
               )} 
               {mode === "signup" ? "Sign Up" : "Sign In"} 
             </Button> 
           </form> 
 
           <div className="text-center text-sm">
             {mode === "signup" ? (
               <p>
                 Already have an account?{" "}
                 <button 
                   type="button" 
                   className="underline underline-offset-4 hover:text-primary font-medium"
                   onClick={() => setMode("signin")}
                 >
                   Sign In
                 </button>
               </p>
             ) : (
               <p>
                 Don't have an account?{" "}
                 <button 
                   type="button" 
                   className="underline underline-offset-4 hover:text-primary font-medium"
                   onClick={() => setMode("signup")}
                 >
                   Sign Up
                 </button>
               </p>
             )}
           </div>
 
           <Button 
             variant="ghost" 
             type="button" 
             disabled={isLoading} 
             className="w-full"
             onClick={() => router.push("/dashboard")}
           > 
             Enter as Guest 
           </Button> 
 
           <p className="px-8 text-center text-sm text-muted-foreground"> 
             By clicking continue, you agree to our{" "} 
             <a href="#" className="underline underline-offset-4 hover:text-primary"> 
               Terms of Service 
             </a>{" "} 
             and{" "} 
             <a href="#" className="underline underline-offset-4 hover:text-primary"> 
               Privacy Policy 
             </a> 
             . 
           </p> 
         </div> 
       </div> 
     </div> 
   ); 
 } 
