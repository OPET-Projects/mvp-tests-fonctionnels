"use client";
import { Controller, Form, useForm } from "react-hook-form";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { redirect } from "next/navigation";

const LoginForm = () => {
  const form = useForm({
    defaultValues: {
      code: "",
    },
  })
  const { control, handleSubmit } = form;

  const onSumbit = (data: {
    code: string;
  }) => {
    console.log(data);
    toast("Connecté avec le code: " + data.code);
    redirect("/vinyls")
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
              <Input placeholder="Code" {...field} />
            </Field>
          )}
        />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
}

export default LoginForm;