-- CreateTable
CREATE TABLE "llm_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_key" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "input_cost" REAL NOT NULL,
    "output_cost" REAL NOT NULL,
    "total_cost" REAL NOT NULL,
    "user_id" TEXT,
    "request_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "llm_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "llm_usage_summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_key" TEXT NOT NULL,
    "total_prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_input_cost" REAL NOT NULL DEFAULT 0,
    "total_output_cost" REAL NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "last_reset_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "llm_usage_summary_provider_key_key" ON "llm_usage_summary"("provider_key");
