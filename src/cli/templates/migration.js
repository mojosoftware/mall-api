const migrationTemplate = `/*
  # {{description}}

  1. 新建表
    - \`{{tableName}}\`
{{fieldComments}}
  
  2. 安全设置
    - 启用行级安全 (RLS)
    - 添加基本访问策略
*/

CREATE TABLE IF NOT EXISTS {{tableName}} (
  id SERIAL PRIMARY KEY,
{{sqlFields}}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_{{tableName}}_updated_at 
    BEFORE UPDATE ON {{tableName}} 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_{{tableName}}_status ON {{tableName}}(status);
CREATE INDEX IF NOT EXISTS idx_{{tableName}}_created_at ON {{tableName}}(created_at);

-- 启用行级安全
ALTER TABLE {{tableName}} ENABLE ROW LEVEL SECURITY;

-- 基本访问策略
CREATE POLICY "{{tableName}}_select_policy" ON {{tableName}}
    FOR SELECT USING (true);

CREATE POLICY "{{tableName}}_insert_policy" ON {{tableName}}
    FOR INSERT WITH CHECK (true);

CREATE POLICY "{{tableName}}_update_policy" ON {{tableName}}
    FOR UPDATE USING (true);

CREATE POLICY "{{tableName}}_delete_policy" ON {{tableName}}
    FOR DELETE USING (true);
`;

module.exports = migrationTemplate;