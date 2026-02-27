-- Add 'md' (markdown) document type support

-- Drop existing constraint
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_document_type_check;

-- Add new constraint with 'md' type
ALTER TABLE public.documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN ('screenplay', 'document', 'md'));

-- Add index for efficient markdown document filtering
CREATE INDEX IF NOT EXISTS idx_documents_markdown_type
ON public.documents(project_id, document_type)
WHERE document_type = 'md';
