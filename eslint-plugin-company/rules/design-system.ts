import { AST_NODE_TYPES, ESLintUtils, TSESLint, TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Cambly/Cambly-Frontend/blob/main/eslint-plugin-cambly/docs/${name}.md`,
);
const materialToDesignSystemLookup = {
  Button: "Button",
  ButtonGroup: "ButtonGroup",
  Divider: "Divider",
  IconButton: "IconButton",
  Select: "Select",
  TextField: "TextField",
  TextLink: "TextLink",
  Typography: "Typography",
} as const;

export function isInDesignSystemMap(key: string): key is keyof typeof materialToDesignSystemLookup {
  return key in materialToDesignSystemLookup;
}

const reportMaterialImportIfApplicable = ({
  context,
  node,
  materialComponentName,
  loc,
}: {
  context: Readonly<TSESLint.RuleContext<"recommendDesignSystemComponent", never[]>>;
  node: TSESTree.ImportSpecifier | TSESTree.ImportDeclaration;
  materialComponentName: string;
  loc?: TSESTree.SourceLocation;
}) => {
  const designSystemComponentName =
    isInDesignSystemMap(materialComponentName) &&
    materialToDesignSystemLookup[materialComponentName];

  if (designSystemComponentName) {
    context.report({
      node,
      messageId: "recommendDesignSystemComponent",
      data: {
        designSystemComponentName,
      },
      loc,
    });
  }
};

export default createRule({
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source.startsWith("@material-ui/core")) {
          const materialComponentName = source.split("/")[2];
          if (materialComponentName) {
            reportMaterialImportIfApplicable({ context, node, materialComponentName });
          } else {
            const childNodes = node.specifiers;
            childNodes.forEach((childNode) => {
              if (childNode.type === AST_NODE_TYPES.ImportSpecifier) {
                reportMaterialImportIfApplicable({
                  context,
                  node: childNode,
                  materialComponentName: childNode.imported.name,
                  loc: childNode.loc,
                });
              }
            });
          }
        }
      },
    };
  },
  name: "design-system",
  meta: {
    docs: {
      description: "Encourage the use of Company's design system over Material UI components",
      recommended: "warn",
    },
    messages: {
      recommendDesignSystemComponent: "Use {{designSystemComponentName}} from components/library",
    },
    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
});
