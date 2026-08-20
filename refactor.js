const fs = require('fs');
let code = fs.readFileSync('src/hooks/queries.ts', 'utf-8');

// Replace addMutation
code = code.replace(
  /const addMutation = useMutation\(\{[\s\S]*?mutationFn: \((.*?): any\) => saveEntity<any>\((.*?)\),[\s\S]*?onSuccess: \(\) => queryClient\.invalidateQueries\(\{ queryKey: \[([^\]]+)\] \}\)[\s\S]*?\}\);/g,
  `const addMutation = useMutation({
    mutationFn: ($1: any) => saveEntity<any>($2),
    onSuccess: (data) => queryClient.setQueryData([$3], (old: any) => [data, ...(old || [])])
  });`
);

// Replace updateMutation
code = code.replace(
  /const updateMutation = useMutation\(\{[\s\S]*?mutationFn: \((.*?): any\) => updateEntity<any>\((.*?)\),[\s\S]*?onSuccess: \(\) => queryClient\.invalidateQueries\(\{ queryKey: \[([^\]]+)\] \}\)[\s\S]*?\}\);/g,
  `const updateMutation = useMutation({
    mutationFn: ($1: any) => updateEntity<any>($2),
    onSuccess: (data, variables) => queryClient.setQueryData([$3], (old: any) => (old || []).map((item: any) => item.id === variables.id ? { ...item, ...variables } : item))
  });`
);

// Replace deleteMutation
code = code.replace(
  /const deleteMutation = useMutation\(\{[\s\S]*?mutationFn: \(id: string\) => deleteEntity\((.*?)\),[\s\S]*?onSuccess: \(\) => queryClient\.invalidateQueries\(\{ queryKey: \[([^\]]+)\] \}\)[\s\S]*?\}\);/g,
  `const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity($1),
    onSuccess: (_, id) => queryClient.setQueryData([$2], (old: any) => (old || []).filter((item: any) => item.id !== id))
  });`
);

fs.writeFileSync('src/hooks/queries.ts', code);
console.log('Refactored queries.ts');
