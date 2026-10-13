-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_method_path_key" ON "Permission"("method", "path") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name") WHERE ("deletedAt" IS NULL);

