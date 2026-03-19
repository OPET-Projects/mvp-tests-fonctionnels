"use client";
import { Controller, useForm } from "react-hook-form";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code
        })
      })
      const responseData = await response.json();
      if (!response.ok || !responseData || !responseData.length) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur inconnue");
      }

      toast("Connecté avec le code: " + data.code);
      localStorage.setItem("userId", responseData[0].id);
      router.push("/vinyls");
    } catch (error) {
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