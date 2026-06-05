import { createClient } from "@/lib/supabase/server";
import { CategoryImagesClient } from "./CategoryImagesClient";
import type { Category } from "@/types";

export const metadata = { title: "Category images — Admin" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Category images</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Upload a hero image for each category. Images render on the public Resources page,
          USAHello-style, alongside the category name.
        </p>
      </div>
      <CategoryImagesClient categories={(categories || []) as Category[]} />
    </div>
  );
}