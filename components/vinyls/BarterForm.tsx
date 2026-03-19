import { Vinyl } from "../../lib/types/vinyls";
import { Button } from "../ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../ui/card";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

const BarterForm = ({
  vinyl,
  propositions,
}: {
  vinyl: Vinyl;
  propositions: Vinyl[];
}) => {
  const form = useForm({
    defaultValues: {
      vinyl: vinyl.id.toString(),
      items: [] as string[],
      message: "",
    },
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const selectedItems = useWatch({
    control,
    name: "items",
  });
  const selectedItemId = selectedItems?.[0] ?? "";
  const selectedItem = propositions.find(
    (proposition) => proposition.id.toString() === selectedItemId,
  );

  const onSubmit = async (data: {
    vinyl: string;
    items: string[];
    message: string;
  }) => {
    try {
      const response = await fetch("/api/barter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: string;
          detail?: string;
        };
        toast.error(body.error ?? body.detail ?? "Erreur lors de l'envoi.");
        return;
      }

      toast.success(
        "Demande de troc envoyée pour : " +
          data.vinyl +
          " contre : " +
          data.items.join(", "),
      );
      form.reset({
        vinyl: vinyl.id.toString(),
        items: [],
        message: "",
      });
    } catch {
      toast.error("Erreur réseau lors de l'envoi de la demande.");
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-3">
      {" "}
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Demande de troc
      </p>
      <h1 className="text-3xl font-semibold">
        Créer une demande d&lsquo;échange
      </h1>
      <p className="text-base text-muted-foreground">
        Sélectionnez un vinyle et décrivez votre proposition.
      </p>
      <h2 className="text-lg font-medium">Intéressé par le vinyle :</h2>
      <Card key={1} className="w-80">
        <CardHeader>
          <CardTitle>{vinyl.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{vinyl.description}</p>
        </CardContent>
      </Card>
      <hr className="my-4" />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Controller
            name="vinyl"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} value={vinyl.id.toString()} />
            )}
          />
          <label htmlFor="items" className="text-sm font-medium">
            Vinyle à proposer
          </label>
          <Controller
            name="items"
            control={control}
            rules={{
              validate: (value) =>
                (value?.length ?? 0) > 0 || "Sélectionnez un vinyle.",
            }}
            render={({ field }) => (
              <select
                id="items"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={field.value?.[0] ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value ? [e.target.value] : [])
                }
              >
                <option value="">Sélectionnez un vinyle</option>
                {propositions.map((item) => (
                  <option key={item.id} value={item.id.toString()}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
          />
          {selectedItem && (
            <Card className="w-80">
              <CardHeader>
                <CardTitle>{selectedItem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {vinyl.file_url ?
                    <Image
                        src={vinyl.file_url}
                        width={200}
                        height={200}
                        alt={vinyl.title}
                        loading="lazy"
                    /> :
                    <Image
                        src="https://ik.imagekit.io/gits23/placeholder.png"
                        width={200}
                        height={200}
                        alt="Picture of the author"
                        loading="lazy"
                    />
                }
                <CardDescription>{vinyl.description}</CardDescription>
              </CardContent>
            </Card>
          )}
          {errors.items && (
            <p className="text-sm text-destructive">
              {errors.items.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-medium">
            Message
          </label>
          <Controller
            name="message"
            control={control}
            rules={{
              validate: (value) =>
                (value?.length ?? 0) > 10 ||
                "Un message de 10 caractères minimum est requis pour décrire votre proposition.",
            }}
            render={({ field }) => (
              <textarea
                {...field}
                id="message"
                rows={4}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Décrivez votre proposition..."
              />
            )}
          />
          {errors.message && (
            <p className="text-sm text-destructive">
              {errors.message.message as string}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </form>
    </div>
  );
};

export default BarterForm;
