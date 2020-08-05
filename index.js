const { promises: fs } = require('fs');
const core = require('@actions/core');
const axios = require('axios').default;

function getInputs() {
   return {
      mdFilePath: core.getInput('md_file_path'),
      confluenceContentId: core.getInput('confluence_content_id'),
      confluenceAuth: {
         username: core.getInput('confluence_username'),
         password: core.getInput('confluence_password')
      }
   };
}

function buildMarkdownHTML(markdownContent) {
   return `<ac:structured-macro ac:name="markdown" ac:schema-version="1" data-layout="default" ac:macro-id="0598ffb9-ba9b-4885-a02b-771d34cef270">
      <ac:plain-text-body>
         <![CDATA[ ${markdownContent} ]]>
      </ac:plain-text-body>
   </ac:structured-macro>`;   
}

async function main() {
   let inputs = getInputs();
   
   let confluenceUrl = `https://stroeerdigitalgroup.atlassian.net/wiki/rest/api/content/${inputs.confluenceContentId}`;

   let mdFileContent = await fs.readFile(inputs.mdFilePath, { encoding: 'utf-8' });
   let confluenceRes = await axios.get(confluenceUrl, { 
      auth: inputs.confluenceAuth 
   });

   console.log(confluenceRes.data);

   axios.put(confluenceUrl, {
      version: {
         number: ++confluenceRes.data.version.number
      },
      title: confluenceRes.data.title,
      type: confluenceRes.data.type,
      body: {
         storage: {
            value: buildMarkdownHTML(mdFileContent),
            representation: 'storage'
         }
     }
   }, { auth: inputs.confluenceAuth });
}

main().catch((err) => core.setFailed(err.message));
