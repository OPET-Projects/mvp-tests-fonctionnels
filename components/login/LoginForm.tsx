"use client";
import { Controller, useForm } from "react-hook-form";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiCall, ApiError } from "@/lib/api";
import { User } from "@/lib/types/user";

const LoginForm = () => {
  const form = useForm({
    defaultValues: {
      code: "",
    },
  })
  const { control, handleSubmit } = form;
  const router = useRouter()

  const onSumbit = async (data: {
    code: string;
  }) => {
    const { code } = data;
    if (!code) {
      toast.error("Veuillez entrer un code.");
      return;
    }
    try {
      const user = await apiCall<User>("/api/users", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      toast("Connecté avec le code: " + data.code);
      localStorage.setItem("userId", user.id.toString());
      router.push("/vinyls");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        toast.error("Code invalide.");
        return;
      }
      console.error("Error during login:", error);
      toast.error("Erreur lors de la connexion. Veuillez réessayer.");
    }
  }
  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center gap-3"
    >
      <h1>Se connecter</h1>
      <form onSubmit={handleSubmit(onSumbit)} className="flex flex-col gap-2">
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <Field>
              <Input placeholder="Code" type="password" {...field} />
            </Field>
          )}
        />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
}

export default LoginForm;