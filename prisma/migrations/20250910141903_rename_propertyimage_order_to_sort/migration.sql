-- füge "sort" nur hinzu, wenn sie noch nicht existiert
ALTER TABLE "PropertyImage" ADD COLUMN IF NOT EXISTS "sort" INTEGER DEFAULT 0;

-- wenn es NOCH eine "order"-Spalte gibt, Werte rüberkopieren und dann löschen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'PropertyImage'
      AND column_name  = 'order'
  ) THEN
    EXECUTE 'UPDATE "PropertyImage" SET "sort" = COALESCE("order", 0) WHERE "sort" IS NULL OR "sort" = 0';
    EXECUTE 'ALTER TABLE "PropertyImage" DROP COLUMN "order"';
  END IF;
END $$;
