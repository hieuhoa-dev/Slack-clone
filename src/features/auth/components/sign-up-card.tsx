import {useState} from "react";
import {FaGithub} from "react-icons/fa";
import {FcGoogle} from "react-icons/fc";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";

import {SignInFlow} from "@/features/auth/types";

interface SignUpCardProps {
    setState: (state: SignInFlow) => void;
}

export const SignUpCard = ({setState}: SignUpCardProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassWord] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    return (
        <Card className="h-full w-full p-8">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">
                    Sign up to continue
                </CardTitle>
                <CardDescription>
                    Use your email or another service to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-0 pb-0">
                <form className="space-y-2.5">
                    <Input
                        disabled={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                    />
                    <Input
                        disabled={false}
                        value={password}
                        onChange={(e) => setPassWord(e.target.value)}
                        placeholder="Password"
                        type="password"
                        required
                    />
                    <Input
                        disabled={false}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        type="password"
                        required
                    />
                    <Button type="submit" className="w-full" size="lg" disabled={false}>
                        Continue
                    </Button>
                    <Separator/>
                    <div className="flex flex-col gap-y-2.5">
                        <Button
                            disabled={false}
                            onClick={() => {
                            }}
                            variant="outline"
                            size="lg"
                            className="w-full relative"
                        >
                            <FcGoogle className="size-5 absolute top-3 left-2.5"/>
                            Continue with Google
                        </Button>
                        <Button
                            disabled={false}
                            onClick={() => {
                            }}
                            variant="outline"
                            size="lg"
                            className="w-full relative"
                        >
                            <FaGithub className="size-5 absolute top-2.5 left-2.5"/>
                            Continue with GitHub
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}<span onClick={()=> setState("signIn")} className="text-sky-700 hover:underline cursor-pointer">Sign ip</span>
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}