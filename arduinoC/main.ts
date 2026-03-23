/*
 * Η ανάλυση του datasheet του MQ9 (SEN0134) — Carbon Monoxide (CO) Sensor
 * έγινε με τη βοήθεια του ClaudeAI. Περισσότερες πληροφορίες για τον 
 * αισθητήρα θα βρείτε στο datasheet.
 *
 * CALIBRATION (REQUIRED before first use) 
 * 1. Place sensor in CLEAN air (no CO present).
 * 2. Wait > 48 hours warm-up time.
 * 3. Run the calibrateMQ9 block — it prints R0 to Serial Monitor.
 * 4. Use that R0 value in the getCOPPM block.
 */
 
enum ANALOG_PORTS {
    //% block="A0"
    A0,
    //% block="A1"
    A1,
	//% block="A2"
    A2,
    //% block="A3"
    A3
}

//% color="#828165" iconWidth=50 iconHeight=40
namespace mq9sensor {
	//% block="Βαθμονόμηση του MQ9 στο pin [PIN] (καθαρός αέρας — εκτύπωσε R0)" blockType="command"
	//% PIN.shadow="dropdown" PIN.options="ANALOG_PORTS" PIN.defl="ANALOG_PORTS.A0"
	export function calibrateMQ9(parameter: any, block: any) {
		let pin = parameter.PIN.code;
		if (Generator.board === 'arduino') {
			Generator.addInclude("math_h", "#include <math.h>");
			Generator.addInclude("mq9_resistance",
				`float mq9_resistance(int pin) {\n` +
				`  float sum = 0;\n` +
				`  for (int i = 0; i < 50; i++) {\n` +
				`    float v = analogRead(pin) * (5.0 / 1023.0);\n` +
				`    if (v < 0.001) v = 0.001;\n` +
				`    sum += (5.0 - v) / v * 10.0;\n` +
				`    delay(20);\n` +
				`  }\n` +
				`  return sum / 50.0;\n` +
				`}`
			);
			Generator.addSetup("serial_begin", `Serial.begin(9600);`);
			Generator.addCode(
				`{\n` +
				`  float _rs_air = mq9_resistance(${pin});\n` +
				`  float _r0     = _rs_air / 9.9;\n` +
				`  Serial.print("MQ9 R0 = ");\n` +
				`  Serial.print(_r0);\n` +
				`  Serial.println(" kOhm");\n` +
				`}`
			);
		}
	}

	//% block="Διάβασε συγκέντρωση CO σε ppm στο pin [PIN] με R0=[R0] kΩ"
	//% PIN.shadow="dropdown" PIN.options="ANALOG_PORTS" PIN.defl="ANALOG_PORTS.A0"
	//% R0.shadow="number" R0.defl="10.0"
	//% blockType="reporter"
	export function getCOPPM(parameter: any, block: any) {
		let pin = parameter.PIN.code;
		let r0  = parameter.R0.code;
		if (Generator.board === 'arduino') {
			Generator.addInclude("math_h", `<math.h>`);
			Generator.addInclude("mq9_resistance",
				`float mq9_resistance(int pin) {\n` +
				`  float sum = 0;\n` +
				`  for (int i = 0; i < 50; i++) {\n` +
				`    float v = analogRead(pin) * (5.0 / 1023.0);\n` +
				`    if (v < 0.001) v = 0.001;\n` +
				`    sum += (5.0 - v) / v * 10.0;\n` +
				`    delay(20);\n` +
				`  }\n` +
				`  return sum / 50.0;\n` +
				`}`
			);
			Generator.addInclude("mq9_co_ppm",
				`float mq9_co_ppm(int pin, float r0) {\n` +
				`  float rs    = mq9_resistance(pin);\n` +
				`  float ratio = rs / r0;\n` +
				`  if (ratio <= 0) return -1;\n` +
				`  float ppm = 100.0 * pow(ratio, -1.53);\n` +
				`  if (ppm < 0) ppm = 0;\n` +
				`  return ppm;\n` +
				`}`
			);
			Generator.addCode(`mq9_co_ppm(${pin}, ${r0})`);
		}
	}

	//% block="Διάβασε συγκέντρωση CO σε ppm στο pin [PIN] (πρόχειρη εκτίμηση - χωρίς βαθμονόμηση)" blockType="reporter"
	//% PIN.shadow="dropdown" PIN.options="ANALOG_PORTS" PIN.defl="ANALOG_PORTS.A0"
	export function getCOPPMSimple(parameter: any, block: any) {
		let pin = parameter.PIN.code;
		if (Generator.board === 'arduino') {
			Generator.addInclude("mq9_co_simple",
				`float mq9_co_simple(int pin) {\n` +
				`  float ppm = analogRead(pin) * 10.0;\n` +
				`  return ppm;\n` +
				`}`
			);
			Generator.addCode(`mq9_co_simple(${pin})`);
		}
	}

}